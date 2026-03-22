package main

// UserSettings represents a user's device tokens grouped by platform
type UserSettings struct {
	UserID                   string   `json:"user_id"`
	IOSDeviceToken           []string `json:"ios_device_token"`
	AndroidDeviceToken       []string `json:"android_device_token"`
	PushNotificationsEnabled bool     `json:"push_notifications_enabled"`
}

// PushNotification represents a notification to send to a user
type PushNotification struct {
	UserID  string            `json:"user_id"`
	Title   string            `json:"title"`
	Message string            `json:"message"`
	Data    map[string]string `json:"data,omitempty"`
}
