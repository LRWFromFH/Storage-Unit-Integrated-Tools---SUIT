package models

import (
	"gorm.io/gorm"
)

type Invoice struct {
	gorm.Model
	CustomerID uint      `gorm:"not null"`
	Customer   *Customer `gorm:"foreignKey:CustomerID"`

	Amount      float64 `gorm:"not null"`
	Description string
}
