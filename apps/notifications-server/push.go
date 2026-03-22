package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"github.com/lib/pq"
)

// GetUserDeviceTokens retrieves all active device tokens for a user
func GetUserDeviceTokens(ctx context.Context, db *sql.DB, userID string) (*UserSettings, error) {
	query := `
		SELECT token, platform
		FROM push_devices
		WHERE user_id = $1 AND is_active = true AND environment = 'prod'
	`

	rows, err := db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query push_devices: %w", err)
	}
	defer rows.Close()

	settings := &UserSettings{
		UserID:                   userID,
		PushNotificationsEnabled: true,
		IOSDeviceToken:           []string{},
		AndroidDeviceToken:       []string{},
	}

	for rows.Next() {
		var token, platform string
		if err := rows.Scan(&token, &platform); err != nil {
			log.Printf("Failed to scan push_devices row: %v", err)
			continue
		}
		if platform == "ios" {
			settings.IOSDeviceToken = append(settings.IOSDeviceToken, token)
		} else if platform == "android" {
			settings.AndroidDeviceToken = append(settings.AndroidDeviceToken, token)
		}
	}

	if len(settings.IOSDeviceToken) == 0 && len(settings.AndroidDeviceToken) == 0 {
		return nil, fmt.Errorf("no active device tokens found for user %s", userID)
	}

	log.Printf("Found %d iOS and %d Android tokens for user %s",
		len(settings.IOSDeviceToken), len(settings.AndroidDeviceToken), userID)
	return settings, nil
}

// GetMultipleUsersDeviceTokens retrieves device tokens for multiple users in a single query
func GetMultipleUsersDeviceTokens(ctx context.Context, db *sql.DB, userIDs []string) (map[string]*UserSettings, error) {
	if len(userIDs) == 0 {
		return make(map[string]*UserSettings), nil
	}

	query := `
		SELECT user_id, token, platform
		FROM push_devices
		WHERE user_id = ANY($1) AND is_active = true AND environment = 'prod'
	`

	rows, err := db.QueryContext(ctx, query, pq.Array(userIDs))
	if err != nil {
		return nil, fmt.Errorf("failed to query push_devices: %w", err)
	}
	defer rows.Close()

	results := make(map[string]*UserSettings)
	for rows.Next() {
		var userID, token, platform string
		if err := rows.Scan(&userID, &token, &platform); err != nil {
			log.Printf("Failed to scan push_devices row: %v", err)
			continue
		}
		if _, exists := results[userID]; !exists {
			results[userID] = &UserSettings{
				UserID:                   userID,
				PushNotificationsEnabled: true,
				IOSDeviceToken:           []string{},
				AndroidDeviceToken:       []string{},
			}
		}
		if platform == "ios" {
			results[userID].IOSDeviceToken = append(results[userID].IOSDeviceToken, token)
		} else if platform == "android" {
			results[userID].AndroidDeviceToken = append(results[userID].AndroidDeviceToken, token)
		}
	}

	return results, nil
}

// SendPushNotification sends a push notification to all of a user's devices
func SendPushNotification(ctx context.Context, db *sql.DB, pusher *GorushPusher, notification *PushNotification) error {
	settings, err := GetUserDeviceTokens(ctx, db, notification.UserID)
	if err != nil {
		return fmt.Errorf("failed to get device tokens: %w", err)
	}

	if !settings.PushNotificationsEnabled {
		log.Printf("Push notifications disabled for user %s", notification.UserID)
		return nil
	}

	sentCount := 0

	for _, token := range settings.IOSDeviceToken {
		if token == "" {
			continue
		}
		if err := pusher.SendToiOS(token, notification.Title, notification.Message, notification.Data); err != nil {
			log.Printf("Failed to send to iOS device: %v", err)
		} else {
			sentCount++
		}
	}

	for _, token := range settings.AndroidDeviceToken {
		if token == "" {
			continue
		}
		if err := pusher.SendToAndroid(token, notification.Title, notification.Message, notification.Data); err != nil {
			log.Printf("Failed to send to Android device: %v", err)
		} else {
			sentCount++
		}
	}

	if sentCount == 0 {
		return fmt.Errorf("no devices to send to for user %s", notification.UserID)
	}

	log.Printf("Push notification sent to %d device(s) for user %s", sentCount, notification.UserID)
	return nil
}

// SendPushNotifications sends push notifications to multiple users (batch)
func SendPushNotifications(ctx context.Context, db *sql.DB, pusher *GorushPusher, notifications []*PushNotification) error {
	if len(notifications) == 0 {
		return nil
	}

	// Collect unique user IDs
	userIDs := make([]string, 0, len(notifications))
	userIDSet := make(map[string]bool)
	notificationsByUser := make(map[string][]*PushNotification)

	for _, notif := range notifications {
		if !userIDSet[notif.UserID] {
			userIDs = append(userIDs, notif.UserID)
			userIDSet[notif.UserID] = true
		}
		notificationsByUser[notif.UserID] = append(notificationsByUser[notif.UserID], notif)
	}

	// Bulk fetch device tokens
	settingsMap, err := GetMultipleUsersDeviceTokens(ctx, db, userIDs)
	if err != nil {
		return fmt.Errorf("failed to get device tokens: %w", err)
	}

	totalSent := 0
	for userID, userNotifications := range notificationsByUser {
		settings, exists := settingsMap[userID]
		if !exists || !settings.PushNotificationsEnabled {
			continue
		}

		for _, notification := range userNotifications {
			for _, token := range settings.IOSDeviceToken {
				if token == "" {
					continue
				}
				if err := pusher.SendToiOS(token, notification.Title, notification.Message, notification.Data); err != nil {
					log.Printf("Failed to send to iOS: %v", err)
				} else {
					totalSent++
				}
			}
			for _, token := range settings.AndroidDeviceToken {
				if token == "" {
					continue
				}
				if err := pusher.SendToAndroid(token, notification.Title, notification.Message, notification.Data); err != nil {
					log.Printf("Failed to send to Android: %v", err)
				} else {
					totalSent++
				}
			}
		}
	}

	log.Printf("Sent %d push notifications to %d user(s)", totalSent, len(userIDs))
	return nil
}
