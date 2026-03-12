package models

import "gorm.io/gorm"

// models/ledger.go
type LedgerEntry struct {
	gorm.Model
	CustomerID  uint
	Amount      float64
	Type        string // e.g., "payment", "charge"
	Description string
}
