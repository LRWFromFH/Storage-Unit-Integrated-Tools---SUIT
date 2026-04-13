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

type InsuranceRequest struct {
	ProviderName  string    `json:"provider_name" binding:"required"`
	PolicyNumber  string    `json:"policy_number" binding:"required"`
	CoverageLimit float64   `json:"coverage_limit" binding:"required"`
	ExpiryDate    time.Time `json:"expiry_date" binding:"required"`
}
