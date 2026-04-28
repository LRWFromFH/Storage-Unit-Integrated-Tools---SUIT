package services

import (
	"backend/database"
	"backend/models"
	"fmt"
	"time"

	"gorm.io/gorm"
)

func CreateCharge(customerID uint, unitID uint, amount float64, desc string) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Create Invoice
		inv := models.Invoice{
			CustomerID:  customerID,
			UnitID:      unitID,
			Amount:      amount,
			Description: desc,
		}
		if err := tx.Create(&inv).Error; err != nil {
			return err
		}

		var typeStr string
		if amount < 0 {
			typeStr = "credit"
		} else {
			typeStr = "charge"
		}

		// 2. Create Ledger Entry linked by InvoiceID only (no association struct — avoids GORM upsert)
		entry := models.LedgerEntry{
			CustomerID:  customerID,
			UnitID:      &unitID,
			InvoiceID:   inv.ID,
			Amount:      -amount, // Charges reduce the balance
			Type:        typeStr,
			Description: desc,
		}
		return tx.Create(&entry).Error
	})
}

func GetCustomerBalance(customerID uint) (float64, error) {
	var balance float64
	err := database.DB.Model(&models.LedgerEntry{}).
		Where("customer_id = ?", customerID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&balance).Error
	return balance, err
}

func GetUnitBalance(customerID uint, unitID uint) (float64, error) {
	var balance float64
	err := database.DB.Model(&models.LedgerEntry{}).
		Where("customer_id = ? AND unit_id = ?", customerID, unitID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&balance).Error
	return balance, err
}

func RecordPayment(customerID uint, unitID uint, amount float64, desc string) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var uID *uint
		if unitID != 0 {
			uID = &unitID
		}

		// Find the oldest unpaid invoice for this customer+unit
		var unpaidInvoice models.Invoice
		err := tx.Where(
			"customer_id = ? AND unit_id = ? AND status != ? AND status != ?",
			customerID, unitID, "paid", "credit",
		).Order("created_at asc").First(&unpaidInvoice).Error

		if err != nil {
			// No unpaid invoice found — payment cannot be applied
			return fmt.Errorf("no unpaid invoice found for unit %d: create a charge first", unitID)
		}

		// Create ledger entry linked by InvoiceID only (no association struct — avoids GORM upsert)
		entry := models.LedgerEntry{
			CustomerID:  customerID,
			UnitID:      uID,
			InvoiceID:   unpaidInvoice.ID,
			Amount:      amount,
			Type:        "payment",
			Description: desc,
		}
		if err := tx.Create(&entry).Error; err != nil {
			return err
		}

		// Update invoice status
		if amount >= unpaidInvoice.Amount {
			tx.Model(&unpaidInvoice).Update("status", "paid")
		} else if amount > 0 {
			tx.Model(&unpaidInvoice).Update("status", "partial")
		}

		return nil
	})
}

func CheckAndDeactivateLateCustomers() {
	cutoff := time.Now().AddDate(0, 0, -5)

	var invoices []models.Invoice
	database.DB.Where(
		"(status = 'unpaid' OR status = 'partial') AND created_at <= ? AND description LIKE ?",
		cutoff, "Monthly Rent%",
	).Find(&invoices)

	for _, inv := range invoices {
		database.DB.Model(&models.Unit{}).
			Where("id = ? AND status != ?", inv.UnitID, models.UnitStatusDeactivated).
			Update("status", models.UnitStatusDeactivated)
	}
}

func CheckAndProcessStorageBilling() {
	var units []models.Unit
	now := time.Now()

	// Query only units that HAVE a due date and it has passed
	// GORM handles the "IS NOT NULL" check automatically if you query correctly
	err := database.DB.Where("customer_id IS NOT NULL AND next_due_date IS NOT NULL AND next_due_date <= ?", now).Find(&units).Error
	if err != nil {
		return
	}

	for _, unit := range units {
		// Safety: Even with the SQL check, double-check the pointer before dereferencing
		if unit.NextDueDate == nil {
			continue
		}

		desc := fmt.Sprintf("Monthly Rent - Unit %s", unit.UnitNumber)
		if err := CreateCharge(*unit.CustomerID, unit.ID, unit.Price, desc); err != nil {
			continue
		}

		// Advance the date: Dereference (*), Add month, then take New Address (&)
		newDate := unit.NextDueDate.AddDate(0, 1, 0)
		database.DB.Model(&unit).Update("NextDueDate", &newDate)
	}
}
