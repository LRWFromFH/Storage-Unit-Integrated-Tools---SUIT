package models

import (
	"time"

	"gorm.io/gorm"
)

// Session represents a user session in the system
// A users can have multiple sessions (e.g. logged in on multiple devices)
type Session struct {
	gorm.Model
	EmployeeID  uint      `gorm:"not null"`
	Employee    Employee  `gorm:"foreignKey:SMID"`
	Token       string    `gorm:"unique;not null"`
	cookieValue string    `gorm:"not null"`
	expiration  time.Time `gorm:"not null"`
	createdAt   time.Time `gorm:"not null"`
}
