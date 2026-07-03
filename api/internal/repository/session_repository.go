package repository

import (
	"database/sql"
	"fmt"
	"time"

	"b2-management/internal/models"

	"github.com/google/uuid"
)

type SessionRepository struct {
	db *sql.DB
}

func NewSessionRepository(db *sql.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(userID uuid.UUID, refreshToken string, expiresAt time.Time) (*models.Session, error) {
	session := &models.Session{}
	err := r.db.QueryRow(`
		INSERT INTO sessions (user_id, refresh_token, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, refresh_token, expires_at, revoked_at, created_at`,
		userID, refreshToken, expiresAt,
	).Scan(
		&session.ID, &session.UserID, &session.RefreshToken,
		&session.ExpiresAt, &session.RevokedAt, &session.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return session, nil
}

func (r *SessionRepository) FindByRefreshToken(refreshToken string) (*models.Session, error) {
	session := &models.Session{}
	err := r.db.QueryRow(`
		SELECT id, user_id, refresh_token, expires_at, revoked_at, created_at
		FROM sessions WHERE refresh_token = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
		refreshToken,
	).Scan(
		&session.ID, &session.UserID, &session.RefreshToken,
		&session.ExpiresAt, &session.RevokedAt, &session.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find session: %w", err)
	}

	return session, nil
}

func (r *SessionRepository) Revoke(refreshToken string) error {
	_, err := r.db.Exec(
		"UPDATE sessions SET revoked_at = $1 WHERE refresh_token = $2 AND revoked_at IS NULL",
		time.Now(), refreshToken,
	)
	if err != nil {
		return fmt.Errorf("failed to revoke session: %w", err)
	}

	return nil
}

func (r *SessionRepository) RevokeAllByUserID(userID uuid.UUID) error {
	_, err := r.db.Exec(
		"UPDATE sessions SET revoked_at = $1 WHERE user_id = $2 AND revoked_at IS NULL",
		time.Now(), userID,
	)
	if err != nil {
		return fmt.Errorf("failed to revoke user sessions: %w", err)
	}

	return nil
}
