package models

import (
	"time"

	"gorm.io/gorm"
)

// models/insurance.go
type Insurance struct {
	gorm.Model
	UnitID        uint `gorm:"uniqueIndex"`
	ProviderName  string
	PolicyNumber  string
	CoverageLimit float64
	ExpiryDate    time.Time
}
