package repository

import (
	"database/sql"
	"fmt"
	"time"

	"b2-management/internal/models"
)

type BucketAnalyticsRepository struct {
	db *sql.DB
}

func NewBucketAnalyticsRepository(db *sql.DB) *BucketAnalyticsRepository {
	return &BucketAnalyticsRepository{db: db}
}

// Upsert insere ou atualiza os dados analíticos de um bucket
func (r *BucketAnalyticsRepository) Upsert(bucketName string, objectCount, storageSize int64) error {
	_, err := r.db.Exec(`
		INSERT INTO bucket_analytics (bucket_name, object_count, storage_size, last_updated_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		ON CONFLICT (bucket_name)
		DO UPDATE SET
			object_count = $2,
			storage_size = $3,
			last_updated_at = NOW(),
			updated_at = NOW()
	`, bucketName, objectCount, storageSize)
	if err != nil {
		return fmt.Errorf("failed to upsert bucket analytics: %w", err)
	}
	return nil
}

// FindAll retorna todos os dados analíticos
func (r *BucketAnalyticsRepository) FindAll() ([]models.BucketAnalytics, error) {
	rows, err := r.db.Query(`
		SELECT id, bucket_name, object_count, storage_size, last_updated_at, created_at, updated_at
		FROM bucket_analytics
		ORDER BY bucket_name
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to list bucket analytics: %w", err)
	}
	defer rows.Close()

	var analytics []models.BucketAnalytics
	for rows.Next() {
		var a models.BucketAnalytics
		err := rows.Scan(
			&a.ID, &a.BucketName, &a.ObjectCount,
			&a.StorageSize, &a.LastUpdatedAt, &a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan bucket analytics: %w", err)
		}
		analytics = append(analytics, a)
	}

	if analytics == nil {
		analytics = []models.BucketAnalytics{}
	}

	return analytics, nil
}

// FindByBucketName retorna dados analíticos de um bucket específico
func (r *BucketAnalyticsRepository) FindByBucketName(bucketName string) (*models.BucketAnalytics, error) {
	var a models.BucketAnalytics
	err := r.db.QueryRow(`
		SELECT id, bucket_name, object_count, storage_size, last_updated_at, created_at, updated_at
		FROM bucket_analytics
		WHERE bucket_name = $1
	`, bucketName).Scan(
		&a.ID, &a.BucketName, &a.ObjectCount,
		&a.StorageSize, &a.LastUpdatedAt, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find bucket analytics: %w", err)
	}

	return &a, nil
}

// DeleteByBucketName remove os dados analíticos de um bucket
func (r *BucketAnalyticsRepository) DeleteByBucketName(bucketName string) error {
	_, err := r.db.Exec("DELETE FROM bucket_analytics WHERE bucket_name = $1", bucketName)
	if err != nil {
		return fmt.Errorf("failed to delete bucket analytics: %w", err)
	}
	return nil
}

// GetLastUpdatedAt retorna a data da última atualização dos analytics
func (r *BucketAnalyticsRepository) GetLastUpdatedAt() (*time.Time, error) {
	var lastUpdated sql.NullTime
	err := r.db.QueryRow("SELECT MAX(last_updated_at) FROM bucket_analytics").Scan(&lastUpdated)
	if err != nil {
		return nil, fmt.Errorf("failed to get last updated at: %w", err)
	}
	if lastUpdated.Valid {
		return &lastUpdated.Time, nil
	}
	return nil, nil
}

// EnsureExists verifica se existe registro para um bucket, se não existir cria um vazio
func (r *BucketAnalyticsRepository) EnsureExists(bucketName string) error {
	_, err := r.db.Exec(`
		INSERT INTO bucket_analytics (bucket_name, object_count, storage_size)
		VALUES ($1, 0, 0)
		ON CONFLICT (bucket_name) DO NOTHING
	`, bucketName)
	if err != nil {
		return fmt.Errorf("failed to ensure bucket analytics exists: %w", err)
	}
	return nil
}

// DeleteByNames remove registros de buckets que não existem mais
func (r *BucketAnalyticsRepository) DeleteByNames(names []string) error {
	if len(names) == 0 {
		return nil
	}

	// Build query with placeholders
	query := "DELETE FROM bucket_analytics WHERE bucket_name NOT IN ("
	args := make([]interface{}, len(names))
	for i, name := range names {
		if i > 0 {
			query += ", "
		}
		query += fmt.Sprintf("$%d", i+1)
		args[i] = name
	}
	query += ")"

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to delete stale bucket analytics: %w", err)
	}
	return nil
}

// ListBucketsWithAnalytics retorna todos os buckets que têm analytics
func (r *BucketAnalyticsRepository) ListBucketsWithAnalytics() ([]string, error) {
	rows, err := r.db.Query("SELECT bucket_name FROM bucket_analytics")
	if err != nil {
		return nil, fmt.Errorf("failed to list buckets with analytics: %w", err)
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, fmt.Errorf("failed to scan bucket name: %w", err)
		}
		names = append(names, name)
	}

	return names, nil
}
