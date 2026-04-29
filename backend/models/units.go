package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	UnitStatusNormal      = "Normal"
	UnitStatusDeactivated = "Deactivated"
	UnitStatusCleaning    = "Cleaning"
	UnitStatusDamaged     = "Damaged"
)

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
	Reserved     bool
	Status       string     //This is if the unit needs cleaning, is damaged, or something else
	NextDueDate  *time.Time `gorm:"type:date"` // Now nullable
}

type CreateUnitRequest struct {
	UnitNumber string  `json:"unit_number" binding:"required"`
	SizeType   string  `json:"size_type" binding:"required"`
	Price      float64 `json:"price" binding:"required"`
}

type AssignCustomerRequest struct {
	CustomerID uint `json:"customer_id" binding:"required"`
}

type UpdateUnitRequest struct {
	SizeType   string     `json:"size_type"`
	Price      float64    `json:"price"`
	Status     string     `json:"status"`
	Length     int        `json:"length"`
	Width      int        `json:"width"`
	Height     int        `json:"height"`
	Reserved   bool       `json:"reserved"`
	CustomerID *uint      `json:"customer_id"`
	NextDueDate *time.Time `json:"next_due_date"`
}

type UnitCombineRequest struct {
	//Technically we don't need the customer information to
	//combine units in the system.
	CustomerID uint    `json:"customer_id,omitempty"`
	UnitIDs    []uint  `json:"unit_ids" binding:"required"`
	Price      float64 `json:"price" binding:"required"`
}
