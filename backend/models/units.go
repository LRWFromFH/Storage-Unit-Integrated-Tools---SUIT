package models

import "gorm.io/gorm"

type Unit struct {
	gorm.Model
	UnitNumber string `gorm:"unique;not null"`
	SizeType   string `gorm:"not null"` // e.g., "5x10", "10x20"

	// The "Relationship" fields
	// This stores the ID of the Customer
	CustomerID *uint
	// This allows GORM to "Join" and get the full Customer object easily
	Renter *Customer `gorm:"foreignKey:CustomerID"`
	Price  float64   `gorm:"not null"`
}

type CreateUnitRequest struct {
	UnitNumber string  `json:"unit_number" binding:"required"`
	SizeType   string  `json:"size_type" binding:"required"`
	Price      float64 `json:"price" binding:"required"`
}
