package services_test

import (
	"backend/database"
	"backend/models"
	"backend/services"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateCharge(t *testing.T) {
	small, medium, large, xlarge := 50, 35, 25, 15

	database.DevInit(small, medium, large, xlarge, true)

	// 1. Setup Mock Data
	cust := models.Customer{FirstName: "John", LastName: "Doe"}
	database.DB.Create(&cust)
	unit := models.Unit{UnitNumber: "A1", SizeType: "10x10"}
	database.DB.Create(&unit)

	// 2. Execute Logic
	err := services.CreateCharge(cust.ID, unit.ID, 100.00, "Monthly Rent")

	// 3. Assertions
	assert.NoError(t, err)

	var inv models.Invoice
	database.DB.First(&inv, "customer_id = ?", cust.ID)
	assert.Equal(t, 100.00, inv.Amount)
	assert.Equal(t, "unpaid", inv.Status)

	var entry models.LedgerEntry
	database.DB.First(&entry, "customer_id = ?", cust.ID)
	assert.Equal(t, -100.00, entry.Amount) // Charges must be negative
	assert.Equal(t, "charge", entry.Type)
}

func TestRecordPaymentAndBalance(t *testing.T) {
	small, medium, large, xlarge := 50, 35, 25, 15

	database.DevInit(small, medium, large, xlarge, true)
	db := database.DB

	// 1. Setup: Customer with an unpaid invoice
	cust := models.Customer{FirstName: "Jane", LastName: "Smith"}
	db.Create(&cust)
	unit := models.Unit{UnitNumber: "B2"}
	db.Create(&unit)

	// Create an initial charge
	services.CreateCharge(cust.ID, unit.ID, 150.00, "Rent Jan")

	// 2. Execute: Record a payment that matches the charge
	err := services.RecordPayment(cust.ID, unit.ID, 150.00, "Payment Jan")
	assert.NoError(t, err)

	// 3. Assert: Check Invoice Status
	var inv models.Invoice
	db.First(&inv, "customer_id = ?", cust.ID)
	assert.Equal(t, "paid", inv.Status, "Invoice should be marked as paid")

	// 4. Assert: Check Balance (Should be 0)
	balance, _ := services.GetCustomerBalance(cust.ID)
	assert.Equal(t, 0.0, balance)
}

func TestOverpayment(t *testing.T) {
	small, medium, large, xlarge := 50, 35, 25, 15

	database.DevInit(small, medium, large, xlarge, true)
	db := database.DB
	cust := models.Customer{FirstName: "Rich", LastName: "Uncle"}
	db.Create(&cust)

	// Charge 100, Pay 500
	services.CreateCharge(cust.ID, 1, 100.00, "Small Box")
	services.RecordPayment(cust.ID, 1, 500.00, "Prepayment")

	balance, _ := services.GetCustomerBalance(cust.ID)

	// Balance should be +400 (a credit)
	assert.Equal(t, 400.0, balance)
}

func TestUnderpayment(t *testing.T) {
	small, medium, large, xlarge := 50, 35, 25, 15

	database.DevInit(small, medium, large, xlarge, true)
	db := database.DB
	cust := models.Customer{FirstName: "Poor", LastName: "Timmy"}
	db.Create(&cust)

	// Charge 100, Pay 500
	services.CreateCharge(cust.ID, 1, 100.00, "Small Box")
	services.RecordPayment(cust.ID, 1, 50.00, "Partial payment")

	balance, _ := services.GetCustomerBalance(cust.ID)

	// Balance should be -50 (a partial)
	assert.Equal(t, -50.0, balance)
}

func TestTransactionRollback(t *testing.T) {
	small, medium, large, xlarge := 50, 35, 25, 15

	database.DevInit(small, medium, large, xlarge, true)
	db := database.DB

	// Attempt to create a charge with an invalid Customer ID (0)
	// assuming your DB enforces foreign key constraints
	err := services.CreateCharge(0, 1, 100.0, "Ghost Charge")

	assert.Error(t, err)

	// Verify that NO invoice was created because the transaction should have rolled back
	var count int64
	db.Model(&models.Invoice{}).Count(&count)
	assert.Equal(t, int64(0), count, "Invoice should not exist if ledger entry failed")
}
