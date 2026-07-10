package repository

import (
	"database/sql"
	"fmt"
	"time"

	"b2-management/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(req *models.CreateUserRequest) (*models.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	avatar := generateAvatar(req.Email, req.Gender)

	user := &models.User{}
	err = r.db.QueryRow(`
		INSERT INTO users (name, surname, email, password_hash, role, gender, avatar)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, name, surname, email, password_hash, role, gender, avatar, is_active, deleted_at, created_at, updated_at`,
		req.Name, req.Surname, req.Email, string(hash), req.Role, req.Gender, avatar,
	).Scan(
		&user.ID, &user.Name, &user.Surname, &user.Email,
		&user.PasswordHash, &user.Role, &user.Gender, &user.Avatar,
		&user.IsActive, &user.DeletedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) FindByID(id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(`
		SELECT id, name, surname, email, password_hash, role, gender, avatar, is_active, deleted_at, created_at, updated_at
		FROM users WHERE id = $1 AND deleted_at IS NULL`, id,
	).Scan(
		&user.ID, &user.Name, &user.Surname, &user.Email,
		&user.PasswordHash, &user.Role, &user.Gender, &user.Avatar,
		&user.IsActive, &user.DeletedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(`
		SELECT id, name, surname, email, password_hash, role, gender, avatar, is_active, deleted_at, created_at, updated_at
		FROM users WHERE email = $1 AND deleted_at IS NULL`, email,
	).Scan(
		&user.ID, &user.Name, &user.Surname, &user.Email,
		&user.PasswordHash, &user.Role, &user.Gender, &user.Avatar,
		&user.IsActive, &user.DeletedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to find user by email: %w", err)
	}

	return user, nil
}

func (r *UserRepository) List(search string, page, limit int) ([]*models.User, int, error) {
	offset := (page - 1) * limit

	// Count query
	countQuery := "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		countQuery += fmt.Sprintf(" AND (LOWER(name) LIKE LOWER($%d) OR LOWER(surname) LIKE LOWER($%d) OR LOWER(email) LIKE LOWER($%d))", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Data query
	dataQuery := `
		SELECT id, name, surname, email, password_hash, role, gender, avatar, is_active, deleted_at, created_at, updated_at
		FROM users WHERE deleted_at IS NULL`

	if search != "" {
		dataQuery += fmt.Sprintf(" AND (LOWER(name) LIKE LOWER($%d) OR LOWER(surname) LIKE LOWER($%d) OR LOWER(email) LIKE LOWER($%d))", argIdx, argIdx, argIdx)
	}

	dataQuery += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	if rows.Err() != nil {
		return nil, 0, fmt.Errorf("failed list users: %w", rows.Err())
	}

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID, &user.Name, &user.Surname, &user.Email,
			&user.PasswordHash, &user.Role, &user.Gender, &user.Avatar,
			&user.IsActive, &user.DeletedAt, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}

	return users, total, nil
}

func (r *UserRepository) Update(id uuid.UUID, req *models.UpdateUserRequest) (*models.User, error) {
	user, err := r.FindByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, nil
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Surname != "" {
		user.Surname = req.Surname
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.Gender != "" {
		user.Gender = req.Gender
		user.Avatar = generateAvatar(user.Email, req.Gender)
	}

	err = r.db.QueryRow(`
		UPDATE users SET name=$1, surname=$2, email=$3, role=$4, gender=$5, avatar=$6, updated_at=NOW()
		WHERE id=$7 AND deleted_at IS NULL
		RETURNING id, name, surname, email, password_hash, role, gender, avatar, is_active, deleted_at, created_at, updated_at`,
		user.Name, user.Surname, user.Email, user.Role, user.Gender, user.Avatar, id,
	).Scan(
		&user.ID, &user.Name, &user.Surname, &user.Email,
		&user.PasswordHash, &user.Role, &user.Gender, &user.Avatar,
		&user.IsActive, &user.DeletedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return user, nil
}

func (r *UserRepository) SoftDelete(id uuid.UUID) error {
	result, err := r.db.Exec(
		"UPDATE users SET deleted_at=$1, is_active=false WHERE id=$2 AND deleted_at IS NULL",
		time.Now(), id,
	)
	if err != nil {
		return fmt.Errorf("failed to soft delete user: %w", err)
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

func (r *UserRepository) ToggleActive(id uuid.UUID, currentUserID uuid.UUID) (*models.User, error) {
	if id == currentUserID {
		return nil, fmt.Errorf("cannot deactivate yourself")
	}

	user, err := r.FindByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	err = r.db.QueryRow(`
		UPDATE users SET is_active=NOT is_active, updated_at=NOW()
		WHERE id=$1 AND deleted_at IS NULL
		RETURNING id, name, surname, email, password_hash, role, gender, avatar, is_active, deleted_at, created_at, updated_at`,
		id,
	).Scan(
		&user.ID, &user.Name, &user.Surname, &user.Email,
		&user.PasswordHash, &user.Role, &user.Gender, &user.Avatar,
		&user.IsActive, &user.DeletedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to toggle user active status: %w", err)
	}

	return user, nil
}

func generateAvatar(email, gender string) string {
	style := "adventurer"
	if gender == "female" {
		style = "adventurer"
	} else if gender == "male" {
		style = "adventurer"
	}
	return fmt.Sprintf("https://api.dicebear.com/9.x/%s/svg?seed=%s", style, email)
}
