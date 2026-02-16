package models

import "gorm.io/gorm"

type Employee struct {
	gorm.Model
	SMID     string `json:"username" gorm:"unique"` //System Member ID
	Email    string `json:"email" gorm:"unique"`    //Company Email
	Password string `json:"-"`
	Role     string `json:"role"`
}

type RegisterRequest struct {
	SMID     string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
