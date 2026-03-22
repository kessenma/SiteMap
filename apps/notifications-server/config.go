package main

import (
	"fmt"
	"os"
)

type Config struct {
	Port         string
	DatabaseURL  string
	GorushURL    string
	IOSBundleID  string
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		Port:        os.Getenv("NOTIFICATIONS_PORT"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		GorushURL:   os.Getenv("GORUSH_URL"),
		IOSBundleID: os.Getenv("IOS_BUNDLE_ID"),
	}

	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.GorushURL == "" {
		cfg.GorushURL = "http://gorush:8088"
	}
	if cfg.IOSBundleID == "" {
		cfg.IOSBundleID = "com.sitemap.app"
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}
