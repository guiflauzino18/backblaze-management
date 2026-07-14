package analytics

import (
	"context"
	"log"
	"sync"
	"time"

	"b2-management/internal/repository"
)

// LogCleanup gerencia a limpeza periódica de logs antigos
type LogCleanup struct {
	retentionDays int
	interval      time.Duration
	execLogRepo   *repository.ExecutionLogRepository
	ctx           context.Context
	cancel        context.CancelFunc
	wg            sync.WaitGroup
}

// NewLogCleanup cria um novo gerenciador de limpeza de logs
func NewLogCleanup(retentionDays int, interval time.Duration, execLogRepo *repository.ExecutionLogRepository) *LogCleanup {
	ctx, cancel := context.WithCancel(context.Background())
	return &LogCleanup{
		retentionDays: retentionDays,
		interval:      interval,
		execLogRepo:   execLogRepo,
		ctx:           ctx,
		cancel:        cancel,
	}
}

// Start inicia o cleanup em background
func (lc *LogCleanup) Start() {
	log.Printf("[LogCleanup] Starting log cleanup worker, retention: %d days, interval: %s", lc.retentionDays, lc.interval)

	// Executa imediatamente na inicialização
	go lc.runOnce()

	// Agenda execuções periódicas
	lc.wg.Add(1)
	go func() {
		defer lc.wg.Done()
		ticker := time.NewTicker(lc.interval)
		defer ticker.Stop()

		for {
			select {
			case <-lc.ctx.Done():
				log.Println("[LogCleanup] Log cleanup worker stopped")
				return
			case <-ticker.C:
				log.Println("[LogCleanup] Starting scheduled log cleanup")
				lc.runOnce()
			}
		}
	}()
}

// Stop para o worker gracefulmente
func (lc *LogCleanup) Stop() {
	log.Println("[LogCleanup] Stopping log cleanup worker...")
	lc.cancel()
	lc.wg.Wait()
	log.Println("[LogCleanup] Log cleanup worker stopped")
}

// runOnce executa uma limpeza dos logs antigos
func (lc *LogCleanup) runOnce() {
	deleted, err := lc.execLogRepo.DeleteOlderThan(lc.retentionDays)
	if err != nil {
		log.Printf("[LogCleanup] Failed to clean old logs: %v", err)
		return
	}

	if deleted > 0 {
		log.Printf("[LogCleanup] Deleted %d old execution log(s) older than %d days", deleted, lc.retentionDays)
	}
}
