package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `json:"id"`
	Name         string     `json:"name"`
	Surname      string     `json:"surname"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Role         string     `json:"role"`
	Gender       string     `json:"gender"`
	Avatar       string     `json:"avatar"`
	IsActive     bool       `json:"is_active"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=255"`
	Surname  string `json:"surname" binding:"required,min=2,max=255"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=admin user"`
	Gender   string `json:"gender" binding:"required,oneof=male female neutral"`
}

type UpdateUserRequest struct {
	Name    string `json:"name" binding:"omitempty,min=2,max=255"`
	Surname string `json:"surname" binding:"omitempty,min=2,max=255"`
	Email   string `json:"email" binding:"omitempty,email"`
	Role    string `json:"role" binding:"omitempty,oneof=admin user"`
	Gender  string `json:"gender" binding:"omitempty,oneof=male female neutral"`
}

type UserResponse struct {
	ID        uuid.UUID  `json:"id"`
	Name      string     `json:"name"`
	Surname   string     `json:"surname"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	Gender    string     `json:"gender"`
	Avatar    string     `json:"avatar"`
	IsActive  bool       `json:"is_active"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Name:      u.Name,
		Surname:   u.Surname,
		Email:     u.Email,
		Role:      u.Role,
		Gender:    u.Gender,
		Avatar:    u.Avatar,
		IsActive:  u.IsActive,
		DeletedAt: u.DeletedAt,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

func (u *User) FullName() string {
	return u.Name + " " + u.Surname
}
