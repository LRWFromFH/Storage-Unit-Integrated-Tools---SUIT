package models

import (
	"time"

	"gorm.io/gorm"
)

// Session represents a user session in the system
// A users can have multiple sessions (e.g. logged in on multiple devices)
type Session struct {
	gorm.Model
	EmployeeID uint      `gorm:"not null"`
	Token      string    `gorm:"unique;not null"`
	Expiration time.Time `gorm:"not null"`
}
