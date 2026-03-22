package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	_ "github.com/lib/pq"
)

var (
	config *Config
	db     *sql.DB
	pusher *GorushPusher
)

// Global variable to track server start time
var serverStartTime = time.Now()

func main() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.SetPrefix("[NOTIFICATIONS] ")

	// Load configuration
	var err error
	config, err = LoadConfig()
	if err != nil {
		log.Fatalf("Configuration error: %v", err)
	}

	// Initialize database connection
	db, err = sql.Open("postgres", config.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Database connected")

	// Initialize Gorush pusher
	pusher = NewGorushPusher(config.GorushURL, config.IOSBundleID)
	log.Printf("Gorush pusher initialized: %s", config.GorushURL)

	// Set up HTTP routes
	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/push/send", handleSend)
	mux.HandleFunc("/api/push/send-batch", handleSendBatch)
	mux.HandleFunc("/api/push/stats", handleStats)

	// Create server with graceful shutdown
	server := &http.Server{
		Addr:    ":" + config.Port,
		Handler: mux,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Notifications server starting on port %s", config.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	<-ctx.Done()

	// Graceful shutdown with 10s timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	log.Println("Notifications server stopped")
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status            string  `json:"status"`
	Service           string  `json:"service"`
	Uptime            float64 `json:"uptime"`
	Timestamp         string  `json:"timestamp"`
	DatabaseConnected bool    `json:"database_connected"`
	GorushConnected   bool    `json:"gorush_connected"`
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(serverStartTime).Seconds()

	dbConnected := false
	if db != nil {
		if err := db.Ping(); err == nil {
			dbConnected = true
		}
	}

	gorushConnected := false
	if pusher != nil {
		gorushConnected = pusher.HealthCheck() == nil
	}

	status := "healthy"
	if !dbConnected || !gorushConnected {
		status = "degraded"
	}

	response := HealthResponse{
		Status:            status,
		Service:           "notifications-server",
		Uptime:            uptime,
		Timestamp:         time.Now().Format(time.RFC3339),
		DatabaseConnected: dbConnected,
		GorushConnected:   gorushConnected,
	}

	w.Header().Set("Content-Type", "application/json")
	if !dbConnected {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
	json.NewEncoder(w).Encode(response)
}

func handleSend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if db == nil || pusher == nil {
		http.Error(w, "Push notifications not configured", http.StatusServiceUnavailable)
		return
	}

	var notification PushNotification
	if err := json.NewDecoder(r.Body).Decode(&notification); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := SendPushNotification(r.Context(), db, pusher, &notification); err != nil {
		log.Printf("Failed to send push notification: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Push notification sent",
	})
}

func handleSendBatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if db == nil || pusher == nil {
		http.Error(w, "Push notifications not configured", http.StatusServiceUnavailable)
		return
	}

	var notifications []*PushNotification
	if err := json.NewDecoder(r.Body).Decode(&notifications); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := SendPushNotifications(r.Context(), db, pusher, notifications); err != nil {
		log.Printf("Failed to send batch push notifications: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Sent %d notifications", len(notifications)),
	})
}

func handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Placeholder — can be enhanced with actual tracking
	stats := map[string]interface{}{
		"total_sent":   0,
		"ios_sent":     0,
		"android_sent": 0,
		"failed":       0,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
