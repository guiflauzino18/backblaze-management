package analytics

import (
	"context"
	"log"
	"sync"
	"time"

	"b2-management/internal/aws"
	"b2-management/internal/repository"
)

type bucketJob struct {
	name string
}

// WorkerPool gerencia o pool de workers para coleta de dados analíticos
type WorkerPool struct {
	workers       int
	interval      time.Duration
	analyticsRepo *repository.BucketAnalyticsRepository
	ctx           context.Context
	cancel        context.CancelFunc
	wg            sync.WaitGroup
}

// NewWorkerPool cria um novo pool de workers
func NewWorkerPool(workers int, interval time.Duration, analyticsRepo *repository.BucketAnalyticsRepository) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())
	return &WorkerPool{
		workers:       workers,
		interval:      interval,
		analyticsRepo: analyticsRepo,
		ctx:           ctx,
		cancel:        cancel,
	}
}

// Start inicia o worker pool em background
func (wp *WorkerPool) Start() {
	log.Printf("[Analytics] Starting worker pool with %d workers, interval: %s", wp.workers, wp.interval)

	// Executa imediatamente na inicialização
	go wp.runOnce()

	// Agenda execuções periódicas
	wp.wg.Add(1)
	go func() {
		defer wp.wg.Done()
		ticker := time.NewTicker(wp.interval)
		defer ticker.Stop()

		for {
			select {
			case <-wp.ctx.Done():
				log.Println("[Analytics] Worker pool stopped")
				return
			case <-ticker.C:
				log.Println("[Analytics] Starting scheduled analytics collection")
				wp.runOnce()
			}
		}
	}()
}

// Stop para o worker pool gracefulmente
func (wp *WorkerPool) Stop() {
	log.Println("[Analytics] Stopping worker pool...")
	wp.cancel()
	wp.wg.Wait()
	log.Println("[Analytics] Worker pool stopped")
}

// runOnce executa uma coleta completa de analytics
func (wp *WorkerPool) runOnce() {
	start := time.Now()
	log.Println("[Analytics] Starting analytics collection...")

	// Lista todos os buckets da AWS
	buckets, err := aws.ListBuckets()
	if err != nil {
		log.Printf("[Analytics] Failed to list buckets: %v", err)
		return
	}

	if len(buckets) == 0 {
		log.Println("[Analytics] No buckets found")
		return
	}

	log.Printf("[Analytics] Found %d buckets to process", len(buckets))

	// Cria canal de trabalho
	jobs := make(chan bucketJob, len(buckets))
	results := make(chan struct{}, len(buckets))

	// Inicia workers
	for i := 0; i < wp.workers; i++ {
		wp.wg.Add(1)
		go wp.worker(jobs, results)
	}

	// Envia jobs
	for _, bucket := range buckets {
		if bucket.Name != nil {
			jobs <- bucketJob{name: *bucket.Name}
		}
	}
	close(jobs)

	// Aguarda todos os workers terminarem
	for i := 0; i < len(buckets); i++ {
		<-results
	}

	// Remove analytics de buckets que não existem mais
	existingNames := make([]string, 0, len(buckets))
	for _, bucket := range buckets {
		if bucket.Name != nil {
			existingNames = append(existingNames, *bucket.Name)
		}
	}
	if err := wp.analyticsRepo.DeleteByNames(existingNames); err != nil {
		log.Printf("[Analytics] Failed to clean stale analytics: %v", err)
	}

	elapsed := time.Since(start)
	log.Printf("[Analytics] Analytics collection completed in %s", elapsed)
}

// worker processa um bucket individual
func (wp *WorkerPool) worker(jobs chan bucketJob, results chan struct{}) {
	defer wp.wg.Done()
	defer func() { results <- struct{}{} }()

	for job := range jobs {
		select {
		case <-wp.ctx.Done():
			return
		default:
		}

		log.Printf("[Analytics] Processing bucket: %s", job.name)

		totalSize, objectCount, err := aws.GetBucketStorageMetrics(job.name)
		if err != nil {
			log.Printf("[Analytics] Failed to get metrics for bucket %s: %v", job.name, err)
			// Mesmo com erro, garante que o bucket existe no banco
			if err := wp.analyticsRepo.EnsureExists(job.name); err != nil {
				log.Printf("[Analytics] Failed to ensure bucket %s exists: %v", job.name, err)
			}
			continue
		}

		if err := wp.analyticsRepo.Upsert(job.name, objectCount, totalSize); err != nil {
			log.Printf("[Analytics] Failed to save analytics for bucket %s: %v", job.name, err)
			continue
		}

		log.Printf("[Analytics] Bucket %s: %d objects, %d bytes", job.name, objectCount, totalSize)
	}
}
