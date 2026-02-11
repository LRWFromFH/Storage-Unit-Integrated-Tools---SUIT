package models

import "gorm.io/gorm"

type Unit struct {
	gorm.Model
	UnitNumber string `gorm:"unique;not null"`
	SizeType   string // e.g., "5x10", "10x20"

	// The "Relationship" fields
	// This stores the ID of the Customer
	CustomerID *uint
	// This allows GORM to "Join" and get the full Customer object easily
	Renter Customer `gorm:"foreignKey:CustomerID"`
}
