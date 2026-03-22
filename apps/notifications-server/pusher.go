package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// GorushNotification represents a single notification payload for gorush
type GorushNotification struct {
	Tokens   []string               `json:"tokens"`
	Platform int                    `json:"platform"` // 1=iOS, 2=Android
	Title    string                 `json:"title,omitempty"`
	Message  string                 `json:"message"`
	Topic    string                 `json:"topic,omitempty"` // iOS bundle ID (required for APNs token auth)
	Sound    string                 `json:"sound,omitempty"`
	Badge    int                    `json:"badge,omitempty"`
	Data     map[string]interface{} `json:"data,omitempty"`
}

// GorushRequest is the request payload for gorush API
type GorushRequest struct {
	Notifications []GorushNotification `json:"notifications"`
}

// GorushResponse is the response from gorush API
type GorushResponse struct {
	Success string `json:"success"`
	Counts  int    `json:"counts"`
	Logs    []struct {
		Type     string `json:"type"`
		Platform string `json:"platform"`
		Token    string `json:"token"`
		Message  string `json:"message"`
		Error    string `json:"error"`
	} `json:"logs"`
}

// GorushPusher handles communication with the gorush push gateway
type GorushPusher struct {
	baseURL     string
	iosBundleID string
	httpClient  *http.Client
}

// NewGorushPusher creates a new push notification client
func NewGorushPusher(gorushURL string, iosBundleID string) *GorushPusher {
	if gorushURL == "" {
		gorushURL = "http://gorush:8088"
	}
	return &GorushPusher{
		baseURL:     gorushURL,
		iosBundleID: iosBundleID,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SendNotification sends a push notification to the specified device tokens
func (p *GorushPusher) SendNotification(tokens []string, platform int, title, message string, data map[string]interface{}) error {
	validTokens := filterValidTokens(tokens)
	if len(validTokens) == 0 {
		return fmt.Errorf("no valid device tokens provided")
	}

	notification := GorushNotification{
		Tokens:   validTokens,
		Platform: platform,
		Title:    title,
		Message:  message,
		Sound:    "default",
		Badge:    1,
		Data:     data,
	}

	// iOS requires topic (bundle ID) for token-based authentication
	if platform == 1 {
		notification.Topic = p.iosBundleID
	}

	return p.sendRequest(GorushRequest{
		Notifications: []GorushNotification{notification},
	})
}

// SendToiOS sends a push notification to a single iOS device
func (p *GorushPusher) SendToiOS(token string, title, message string, data map[string]string) error {
	return p.SendNotification([]string{token}, 1, title, message, convertData(data))
}

// SendToAndroid sends a push notification to a single Android device
func (p *GorushPusher) SendToAndroid(token string, title, message string, data map[string]string) error {
	return p.SendNotification([]string{token}, 2, title, message, convertData(data))
}

// SendToMultiplePlatforms sends notifications to both iOS and Android devices
func (p *GorushPusher) SendToMultiplePlatforms(iosTokens, androidTokens []string, title, message string, data map[string]interface{}) error {
	var notifications []GorushNotification

	validIOS := filterValidTokens(iosTokens)
	if len(validIOS) > 0 {
		notifications = append(notifications, GorushNotification{
			Tokens:   validIOS,
			Platform: 1,
			Title:    title,
			Message:  message,
			Topic:    p.iosBundleID,
			Sound:    "default",
			Badge:    1,
			Data:     data,
		})
	}

	validAndroid := filterValidTokens(androidTokens)
	if len(validAndroid) > 0 {
		notifications = append(notifications, GorushNotification{
			Tokens:   validAndroid,
			Platform: 2,
			Title:    title,
			Message:  message,
			Sound:    "default",
			Data:     data,
		})
	}

	if len(notifications) == 0 {
		log.Printf("No valid device tokens to send notification to")
		return nil
	}

	return p.sendRequest(GorushRequest{Notifications: notifications})
}

func (p *GorushPusher) sendRequest(request GorushRequest) error {
	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal notification request: %w", err)
	}

	req, err := http.NewRequest("POST", p.baseURL+"/api/push", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send push notification: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var gorushResp GorushResponse
	if err := json.Unmarshal(body, &gorushResp); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("gorush returned status %d: %s", resp.StatusCode, string(body))
	}

	for _, logEntry := range gorushResp.Logs {
		if logEntry.Type == "failed-push" {
			log.Printf("Push failed | platform: %s | error: %s", logEntry.Platform, logEntry.Error)
		}
	}

	log.Printf("Push sent | count: %d | status: %s", gorushResp.Counts, gorushResp.Success)
	return nil
}

// HealthCheck verifies the gorush service is running
func (p *GorushPusher) HealthCheck() error {
	resp, err := p.httpClient.Get(p.baseURL + "/healthz")
	if err != nil {
		return fmt.Errorf("gorush health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("gorush health check returned status %d", resp.StatusCode)
	}
	return nil
}

func filterValidTokens(tokens []string) []string {
	valid := make([]string, 0, len(tokens))
	for _, token := range tokens {
		if token != "" {
			valid = append(valid, token)
		}
	}
	return valid
}

func convertData(data map[string]string) map[string]interface{} {
	if data == nil {
		return nil
	}
	result := make(map[string]interface{}, len(data))
	for k, v := range data {
		result[k] = v
	}
	return result
}
