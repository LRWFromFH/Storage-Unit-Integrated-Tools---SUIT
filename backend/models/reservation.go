package models

import "gorm.io/gorm"

const (
	ReservationStatusActive    = "active"
	ReservationStatusFulfilled = "fulfilled"
	ReservationStatusCancelled = "cancelled"
)

type Reservation struct {
	gorm.Model
	CustomerID   uint     `gorm:"not null"`
	Customer     Customer `gorm:"foreignKey:CustomerID"`
	SizeType     string   `gorm:"not null"`
	CardLastFour string   `gorm:"not null"`
	Status       string   `gorm:"default:'active'"`
}

type CreateReservationRequest struct {
	CustomerID   uint   `json:"customer_id" binding:"required"`
	SizeType     string `json:"size_type" binding:"required"`
	CardLastFour string `json:"card_last_four" binding:"required"`
}
