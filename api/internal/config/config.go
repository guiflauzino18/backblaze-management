package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	ServerPort string
	JWTSecret  string
	// AWS/Backblaze Configuration
	AWSAccessKey string
	AWSSecretKey string
	AWSRegion    string
	AWSEndpoint  string
	// Analytics Configuration
	AnalyticsInterval time.Duration
	AnalyticsWorkers  int
	EnableIndexing    bool
	// Execution Logs Configuration
	LogRetentionDays   int
	LogCleanupInterval time.Duration
}

func Load() (*Config, error) {
	// Load .env file from current directory or parent directory
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")

	analyticsInterval, err := time.ParseDuration(getEnv("ANALYTICS_INTERVAL", "24h"))
	if err != nil {
		analyticsInterval = 24 * time.Hour
	}

	analyticsWorkers := getEnvAsInt("ANALYTICS_WORKERS", 2)
	enableIndexing := getEnv("ENABLE_INDEXING", "true") == "true"

	logRetentionDays := getEnvAsInt("LOG_RETENTION_DAYS", 7)
	logCleanupInterval, err := time.ParseDuration(getEnv("LOG_CLEANUP_INTERVAL", "24h"))
	if err != nil {
		logCleanupInterval = 24 * time.Hour
	}

	cfg := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "b2management"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "b2management"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		ServerPort: getEnv("SERVER_PORT", "8080"),
		JWTSecret:  getEnv("JWT_SECRET", ""),
		// AWS/Backblaze Configuration
		AWSAccessKey: getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		AWSEndpoint:  getEnv("AWS_ENDPOINT", ""),
		AWSRegion:    getEnv("AWS_REGION", ""),
		// Analytics Configuration
		AnalyticsInterval: analyticsInterval,
		AnalyticsWorkers:  analyticsWorkers,
		EnableIndexing:    enableIndexing,
		// Execution Logs Configuration
		LogRetentionDays:   logRetentionDays,
		LogCleanupInterval: logCleanupInterval,
	}

	if cfg.DBPassword == "" {
		return nil, fmt.Errorf("DB_PASSWORD environment variable is required")
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is required")
	}

	// AWS Configuration validation
	if cfg.AWSAccessKey == "" {
		return nil, fmt.Errorf("AWS_ACCESS_KEY_ID environment variable is required")
	}
	if cfg.AWSSecretKey == "" {
		return nil, fmt.Errorf("AWS_SECRET_ACCESS_KEY environment variable is required")
	}
	if cfg.AWSEndpoint == "" {
		return nil, fmt.Errorf("AWS_ENDPOINT environment variable is required")
	}
	if cfg.AWSRegion == "" {
		return nil, fmt.Errorf("AWS_REGION environment variable is required")
	}

	return cfg, nil
}

func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	var value int
	_, err := fmt.Sscanf(valueStr, "%d", &value)
	if err != nil {
		return defaultValue
	}
	return value
}
