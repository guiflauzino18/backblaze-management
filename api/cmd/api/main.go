package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"b2-management/internal/analytics"
	"b2-management/internal/aws"
	"b2-management/internal/config"
	"b2-management/internal/database"
	"b2-management/internal/router"
)

// @title B2 Management API
// @version 1.0
// @description API for managing Backblaze B2 cloud storage
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@b2management.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1
func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize AWS client
	if err := aws.InitializeAWSClient(cfg); err != nil {
		log.Fatalf("Failed to initialize AWS client: %v", err)
	}

	// Setup router
	r, analyticsRepo, objectRepo, executionLogRepo := router.Setup(db, cfg)

	// Start analytics worker pool (analytics + object indexing)
	workerPool := analytics.NewWorkerPool(cfg.AnalyticsWorkers, cfg.AnalyticsInterval, cfg.EnableIndexing, cfg.IndexingExcludeBuckets, analyticsRepo, objectRepo)
	workerPool.Start()

	// Start log cleanup worker
	logCleanup := analytics.NewLogCleanup(cfg.LogRetentionDays, cfg.LogCleanupInterval, executionLogRepo)
	logCleanup.Start()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Shutting down server...")
		workerPool.Stop()
		logCleanup.Stop()
		db.Close()
		os.Exit(0)
	}()

	// Start server
	addr := ":" + cfg.ServerPort
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
