package models

import "gorm.io/gorm"

// models/units.go
type Unit struct {
	gorm.Model
	UnitNumber   string    `gorm:"unique;not null"` //This is the original unit number
	SizeType     string    `gorm:"not null"`
	Length       int       `gorm:"not null"` // Length in feet
	Width        int       `gorm:"not null"` // Width in feet
	Height       int       `gorm:"not null"` // Height in feet
	Price        float64   `gorm:"not null"`
	CustomerID   *uint     // Nullable if unit is vacant
	Renter       *Customer `gorm:"foreignKey:CustomerID"`
	Insurance    Insurance `gorm:"foreignKey:UnitID"`
	Combined     bool      `gorm:"not null"` //Whether the unit has been conbined
	CombinedFrom string    //Comma separated list of unit numbers that were combined to create this
}

type CreateUnitRequest struct {
	UnitNumber string  `json:"unit_number" binding:"required"`
	SizeType   string  `json:"size_type" binding:"required"`
	Price      float64 `json:"price" binding:"required"`
}

type UnitCombineRequest struct {
	//Technically we don't need the customer information to
	//combine units in the system.
	CustomerID uint    `json:"customer_id,omitempty"`
	UnitIDs    []uint  `json:"unit_ids" binding:"required"`
	Price      float64 `json:"price" binding:"required"`
}
