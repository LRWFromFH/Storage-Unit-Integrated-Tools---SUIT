package models

import "gorm.io/gorm"

// In a real implementation we would have a time element for due date
// And for time of payment. For now we will disregard this.
// Actually, gorm.Model gives us a time element by default.
// So, we know when an entry is created,
// so we can create the invoice based checking the unit due date.
type LedgerEntry struct {
	gorm.Model
	CustomerID  uint
	UnitID      *uint // Nullable (e.g., a general account credit not tied to a unit)
	InvoiceID   *uint // Nullable (e.g., a payment made before an invoice was generated)
	Amount      float64
	Type        string // "charge", "payment", "refund"
	Description string
}
