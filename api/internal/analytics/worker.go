package analytics

import (
	"context"
	"log"
	"sync"
	"time"

	"b2-management/internal/aws"
	"b2-management/internal/models"
	"b2-management/internal/repository"
)

type bucketJob struct {
	name string
}

// WorkerPool gerencia o pool de workers para coleta de dados analíticos e indexação de objetos
type WorkerPool struct {
	workers        int
	interval       time.Duration
	enableIndexing bool
	excludeBuckets map[string]bool
	analyticsRepo  *repository.BucketAnalyticsRepository
	objectRepo     *repository.ObjectIndexRepository
	ctx            context.Context
	cancel         context.CancelFunc
	wg             sync.WaitGroup
}

// NewWorkerPool cria um novo pool de workers
func NewWorkerPool(workers int, interval time.Duration, enableIndexing bool, excludeBuckets []string, analyticsRepo *repository.BucketAnalyticsRepository, objectRepo *repository.ObjectIndexRepository) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())

	// Converte slice para map para lookup eficiente
	excludeMap := make(map[string]bool, len(excludeBuckets))
	for _, b := range excludeBuckets {
		excludeMap[b] = true
	}

	return &WorkerPool{
		workers:        workers,
		interval:       interval,
		enableIndexing: enableIndexing,
		excludeBuckets: excludeMap,
		analyticsRepo:  analyticsRepo,
		objectRepo:     objectRepo,
		ctx:            ctx,
		cancel:         cancel,
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

		// 1. Coleta métricas de armazenamento
		totalSize, objectCount, err := aws.GetBucketStorageMetrics(job.name)
		if err != nil {
			log.Printf("[Analytics] Failed to get metrics for bucket %s: %v", job.name, err)
			if err := wp.analyticsRepo.EnsureExists(job.name); err != nil {
				log.Printf("[Analytics] Failed to ensure bucket %s exists: %v", job.name, err)
			}
		} else {
			if err := wp.analyticsRepo.Upsert(job.name, objectCount, totalSize); err != nil {
				log.Printf("[Analytics] Failed to save analytics for bucket %s: %v", job.name, err)
			}
			log.Printf("[Analytics] Bucket %s: %d objects, %d bytes", job.name, objectCount, totalSize)
		}

		// 2. Indexa objetos do bucket (apenas se habilitado e bucket não estiver na lista de exclusão)
		if wp.enableIndexing {
			if wp.excludeBuckets[job.name] {
				log.Printf("[Analytics] Bucket %s is in exclude list, skipping indexing", job.name)
			} else {
				if err := wp.indexBucketObjects(job.name); err != nil {
					log.Printf("[Analytics] Failed to index objects for bucket %s: %v", job.name, err)
				}
			}
		} else {
			log.Printf("[Analytics] Indexing disabled for bucket %s", job.name)
		}
	}
}

// indexBucketObjects percorre todos os objetos de um bucket e os indexa no banco
func (wp *WorkerPool) indexBucketObjects(bucketName string) error {
	log.Printf("[Analytics] Indexing objects for bucket: %s", bucketName)

	// Mapa para armazenar keys com delete marker como versão mais recente
	deletedKeys := make(map[string]bool)

	// Primeiro, faz paginação dos delete markers
	var keyMarker *string
	for {
		versionsResult, err := aws.ListObjectsV2VersionsPaginated(bucketName, keyMarker, nil)
		if err != nil {
			return err
		}

		for _, dm := range versionsResult.DeleteMarkers {
			if dm.IsLatest != nil && *dm.IsLatest && dm.Key != nil {
				deletedKeys[*dm.Key] = true
			}
		}

		if versionsResult.IsTruncated != nil && *versionsResult.IsTruncated {
			keyMarker = versionsResult.NextKeyMarker
		} else {
			break
		}
	}

	// Agora percorre todos os objetos atuais com paginação
	var continuationToken *string
	objectCount := 0

	for {
		result, err := aws.ListObjectsV2Paginated(bucketName, continuationToken)
		if err != nil {
			return err
		}

		// Prepara batch para upsert
		var batch []models.BucketObject
		for _, obj := range result.Contents {
			if obj.Key == nil {
				continue
			}

			key := *obj.Key
			isDeleted := deletedKeys[key]
			var lastModified time.Time
			if obj.LastModified != nil {
				lastModified = *obj.LastModified
			}

			var size int64
			if obj.Size != nil {
				size = *obj.Size
			}
			batch = append(batch, models.BucketObject{
				ObjectKey:    key,
				Size:         size,
				LastModified: lastModified,
				IsDeleted:    isDeleted,
			})
			objectCount++
		}

		// Adiciona objetos que têm delete marker mas não estão em Contents
		for key := range deletedKeys {
			found := false
			for _, obj := range result.Contents {
				if obj.Key != nil && *obj.Key == key {
					found = true
					break
				}
			}
			if !found {
				batch = append(batch, models.BucketObject{
					ObjectKey: key,
					Size:      0,
					IsDeleted: true,
				})
				objectCount++
			}
		}

		// Bulk upsert no banco
		if len(batch) > 0 {
			if err := wp.objectRepo.BulkUpsert(bucketName, batch); err != nil {
				return err
			}
		}

		if result.IsTruncated != nil && *result.IsTruncated {
			continuationToken = result.NextContinuationToken
		} else {
			break
		}
	}

	log.Printf("[Analytics] Indexed %d objects for bucket %s", objectCount, bucketName)
	return nil
}
