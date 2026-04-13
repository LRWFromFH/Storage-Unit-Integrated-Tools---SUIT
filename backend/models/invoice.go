package models

import (
	"gorm.io/gorm"
)

type Invoice struct {
	gorm.Model
	CustomerID  uint     `gorm:"not null;index;check:customer_id > 0"`
	Customer    Customer `gorm:"foreignKey:CustomerID"`
	UnitID      uint     `gorm:"not null"` // Added to track which unit generated the bill
	Amount      float64  `gorm:"not null"`
	Status      string   `gorm:"default:'unpaid'"` // 'paid', 'unpaid', 'void'
	Description string
}
