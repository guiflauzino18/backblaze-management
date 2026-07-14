package repository

import (
	"database/sql"
	"fmt"

	"b2-management/internal/models"

	"github.com/google/uuid"
)

type ExecutionLogRepository struct {
	db *sql.DB
}

func NewExecutionLogRepository(db *sql.DB) *ExecutionLogRepository {
	return &ExecutionLogRepository{db: db}
}

func (r *ExecutionLogRepository) Create(req *models.CreateExecutionLogRequest, endpointUserID *uuid.UUID) (*models.ExecutionLog, error) {
	log := &models.ExecutionLog{}
	err := r.db.QueryRow(`
		INSERT INTO execution_logs (bucket_name, exit_code, log_content, endpoint_user_id, executed_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, bucket_name, exit_code, log_content, endpoint_user_id, executed_at, created_at`,
		req.BucketName, req.ExitCode, req.LogContent, endpointUserID,
	).Scan(
		&log.ID, &log.BucketName, &log.ExitCode, &log.LogContent,
		&log.EndpointUserID, &log.ExecutedAt, &log.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create execution log: %w", err)
	}

	return log, nil
}

func (r *ExecutionLogRepository) List(filter models.ExecutionLogFilter) ([]*models.ExecutionLog, int, error) {
	offset := (filter.Page - 1) * filter.Limit

	// Count query
	countQuery := "SELECT COUNT(*) FROM execution_logs WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if filter.BucketName != "" {
		countQuery += fmt.Sprintf(" AND bucket_name = $%d", argIdx)
		args = append(args, filter.BucketName)
		argIdx++
	}

	if filter.ExitCode != nil {
		countQuery += fmt.Sprintf(" AND exit_code = $%d", argIdx)
		args = append(args, *filter.ExitCode)
		argIdx++
	}

	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count execution logs: %w", err)
	}

	// Data query
	dataQuery := `
		SELECT id, bucket_name, exit_code, log_content, endpoint_user_id, executed_at, created_at
		FROM execution_logs WHERE 1=1`

	argsData := []interface{}{}
	argIdxData := 1

	if filter.BucketName != "" {
		dataQuery += fmt.Sprintf(" AND bucket_name = $%d", argIdxData)
		argsData = append(argsData, filter.BucketName)
		argIdxData++
	}

	if filter.ExitCode != nil {
		dataQuery += fmt.Sprintf(" AND exit_code = $%d", argIdxData)
		argsData = append(argsData, *filter.ExitCode)
		argIdxData++
	}

	dataQuery += fmt.Sprintf(" ORDER BY executed_at DESC LIMIT $%d OFFSET $%d", argIdxData, argIdxData+1)
	argsData = append(argsData, filter.Limit, offset)

	rows, err := r.db.Query(dataQuery, argsData...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list execution logs: %w", err)
	}
	defer rows.Close()

	var logs []*models.ExecutionLog
	for rows.Next() {
		log := &models.ExecutionLog{}
		err := rows.Scan(
			&log.ID, &log.BucketName, &log.ExitCode, &log.LogContent,
			&log.EndpointUserID, &log.ExecutedAt, &log.CreatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan execution log: %w", err)
		}
		logs = append(logs, log)
	}

	if rows.Err() != nil {
		return nil, 0, fmt.Errorf("failed list execution logs: %w", rows.Err())
	}

	return logs, total, nil
}

func (r *ExecutionLogRepository) ListBuckets() ([]string, error) {
	rows, err := r.db.Query(`
		SELECT DISTINCT bucket_name FROM execution_logs ORDER BY bucket_name`)
	if err != nil {
		return nil, fmt.Errorf("failed to list buckets: %w", err)
	}
	defer rows.Close()

	var buckets []string
	for rows.Next() {
		var bucket string
		if err := rows.Scan(&bucket); err != nil {
			return nil, fmt.Errorf("failed to scan bucket name: %w", err)
		}
		buckets = append(buckets, bucket)
	}

	return buckets, rows.Err()
}

func (r *ExecutionLogRepository) DeleteOlderThan(days int) (int64, error) {
	result, err := r.db.Exec(
		"DELETE FROM execution_logs WHERE created_at < NOW() - ($1 || ' days')::INTERVAL",
		fmt.Sprintf("%d", days),
	)
	if err != nil {
		return 0, fmt.Errorf("failed to delete old execution logs: %w", err)
	}

	rows, _ := result.RowsAffected()
	return rows, nil
}
