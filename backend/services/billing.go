package services

import (
	"backend/database"
	"backend/models"

	"gorm.io/gorm"
)

func CreateCharge(customerID uint, unitID uint, amount float64, desc string) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Create Invoice
		inv := models.Invoice{CustomerID: customerID,
			UnitID:      unitID,
			Amount:      amount,
			Description: desc}
		if err := tx.Create(&inv).Error; err != nil {
			return err
		}

		// 2. Create Ledger Entry (Charge is negative/debit)
		var type_string string
		if amount < 0 {
			type_string = "credit"
		} else {
			type_string = "charge"
		}

		entry := models.LedgerEntry{
			CustomerID:  customerID,
			UnitID:      &unitID,
			InvoiceID:   &inv.ID, // Link to the invoice we just created
			Amount:      -amount, // Charges decrease the balance
			Type:        type_string,
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
		// Create the Ledger Entry
		// if unitID is 0, we treat it as a general account payment (null)
		// Old debt or something.
		var uID *uint
		if unitID != 0 {
			uID = &unitID
		}

		entry := models.LedgerEntry{
			CustomerID:  customerID,
			UnitID:      uID,
			Amount:      amount,
			Type:        "payment",
			Description: desc,
		}
		if err := tx.Create(&entry).Error; err != nil {
			return err
		}

		// "Pay off" the oldest unpaid invoice for this unit
		var unpaidInvoice models.Invoice
		err := tx.Where("customer_id = ? AND unit_id = ? AND status != ?", customerID, unitID, "paid").
			Order("created_at asc").
			First(&unpaidInvoice).Error

		if err == nil {
			// Logic: Simple check if payment covers the invoice
			if amount >= unpaidInvoice.Amount {
				tx.Model(&unpaidInvoice).Update("status", "paid")
				//If greater than amound we need to create a credit.
				// if (amount - unpaidInvoice.Amount) > 0 {
				// 	err := CreateCharge(customerID, unitID, unpaidInvoice.Amount-amount, desc)
				// 	if err != nil {
				// 		return err
				// 	}
				// }
			} else if amount > 0 && amount < unpaidInvoice.Amount {
				// Partial payment logic
				// We should make status as partial and create a new invoice with the
				// remaining amount to be paid by the customer.
				tx.Model(&unpaidInvoice).Update("status", "partial")
				// err := CreateCharge(customerID, unitID, unpaidInvoice.Amount-amount, desc)
				// if err != nil {
				// 	return err
				// }
			}
		} else {
			return err
		}

		return nil
	})
}
