package models

import (
	"time"

	"github.com/google/uuid"
)

type ExecutionLog struct {
	ID             uuid.UUID  `json:"id"`
	BucketName     string     `json:"bucket_name"`
	ExitCode       int        `json:"exit_code"`
	LogContent     string     `json:"log_content"`
	EndpointUserID *uuid.UUID `json:"endpoint_user_id,omitempty"`
	ExecutedAt     time.Time  `json:"executed_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

type CreateExecutionLogRequest struct {
	BucketName string `json:"bucket_name" binding:"required"`
	ExitCode   int    `json:"exit_code"`
	LogContent string `json:"log_content" binding:"required"`
}

type ExecutionLogFilter struct {
	BucketName string `form:"bucket_name"`
	ExitCode   *int   `form:"exit_code"`
	Page       int    `form:"page,default=1"`
	Limit      int    `form:"limit,default=20"`
}
