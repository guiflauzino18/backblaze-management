package repository

import (
	"database/sql"
	"fmt"

	"b2-management/internal/models"
)

type ObjectIndexRepository struct {
	db *sql.DB
}

func NewObjectIndexRepository(db *sql.DB) *ObjectIndexRepository {
	return &ObjectIndexRepository{db: db}
}

// BulkUpsert insere ou atualiza objetos em lote dentro de uma transação
func (r *ObjectIndexRepository) BulkUpsert(bucketName string, objects []models.BucketObject) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO bucket_objects (bucket_name, object_key, size, last_modified, is_deleted, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (bucket_name, object_key)
		DO UPDATE SET
			size = EXCLUDED.size,
			last_modified = EXCLUDED.last_modified,
			is_deleted = EXCLUDED.is_deleted,
			updated_at = NOW()
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, obj := range objects {
		_, err := stmt.Exec(bucketName, obj.ObjectKey, obj.Size, obj.LastModified, obj.IsDeleted)
		if err != nil {
			return fmt.Errorf("failed to upsert object %s: %w", obj.ObjectKey, err)
		}
	}

	return tx.Commit()
}

// SearchObjects busca objetos por nome usando ILIKE com suporte a pg_trgm
func (r *ObjectIndexRepository) SearchObjects(bucketName, query string, limit, offset int, includeDeleted bool) (*models.ObjectIndexSearchResponse, error) {
	// Busca total de resultados
	var total int
	countQuery := `
		SELECT COUNT(*)
		FROM bucket_objects
		WHERE bucket_name = $1 AND object_key ILIKE '%' || $2 || '%'
	`
	args := []interface{}{bucketName, query}

	if !includeDeleted {
		countQuery += " AND is_deleted = FALSE"
	}

	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count search results: %w", err)
	}

	// Busca resultados paginados
	searchQuery := `
		SELECT object_key, size, last_modified, is_deleted
		FROM bucket_objects
		WHERE bucket_name = $1 AND object_key ILIKE '%' || $2 || '%'
	`
	if !includeDeleted {
		searchQuery += " AND is_deleted = FALSE"
	}
	searchQuery += ` ORDER BY object_key LIMIT $3 OFFSET $4`

	searchArgs := []interface{}{bucketName, query, limit, offset}

	rows, err := r.db.Query(searchQuery, searchArgs...)
	if err != nil {
		return nil, fmt.Errorf("failed to search objects: %w", err)
	}
	defer rows.Close()

	var results []models.ObjectIndexSearchResult
	for rows.Next() {
		var r models.ObjectIndexSearchResult
		var lastModified sql.NullTime
		err := rows.Scan(&r.ObjectKey, &r.Size, &lastModified, &r.IsDeleted)
		if err != nil {
			return nil, fmt.Errorf("failed to scan search result: %w", err)
		}
		if lastModified.Valid {
			r.LastModified = lastModified.Time
		}
		results = append(results, r)
	}

	if results == nil {
		results = []models.ObjectIndexSearchResult{}
	}

	return &models.ObjectIndexSearchResponse{
		Results: results,
		Total:   total,
	}, nil
}

// GetByKey busca um objeto específico pelo bucket e key
func (r *ObjectIndexRepository) GetByKey(bucketName, objectKey string) (*models.BucketObject, error) {
	var obj models.BucketObject
	var lastModified sql.NullTime

	err := r.db.QueryRow(`
		SELECT id, bucket_name, object_key, size, last_modified, is_deleted, created_at, updated_at
		FROM bucket_objects
		WHERE bucket_name = $1 AND object_key = $2
	`, bucketName, objectKey).Scan(
		&obj.ID, &obj.BucketName, &obj.ObjectKey, &obj.Size,
		&lastModified, &obj.IsDeleted, &obj.CreatedAt, &obj.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find object %s in bucket %s: %w", objectKey, bucketName, err)
	}

	if lastModified.Valid {
		obj.LastModified = lastModified.Time
	}

	return &obj, nil
}

// DeleteByBucketName remove todos os objetos indexados de um bucket
func (r *ObjectIndexRepository) DeleteByBucketName(bucketName string) error {
	_, err := r.db.Exec("DELETE FROM bucket_objects WHERE bucket_name = $1", bucketName)
	if err != nil {
		return fmt.Errorf("failed to delete objects for bucket %s: %w", bucketName, err)
	}
	return nil
}

// CleanStaleObjects remove objetos de buckets que não existem mais
func (r *ObjectIndexRepository) CleanStaleObjects(existingBucketNames []string) error {
	if len(existingBucketNames) == 0 {
		return nil
	}

	query := "DELETE FROM bucket_objects WHERE bucket_name NOT IN ("
	args := make([]interface{}, len(existingBucketNames))
	for i, name := range existingBucketNames {
		if i > 0 {
			query += ", "
		}
		query += fmt.Sprintf("$%d", i+1)
		args[i] = name
	}
	query += ")"

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to clean stale objects: %w", err)
	}
	return nil
}
