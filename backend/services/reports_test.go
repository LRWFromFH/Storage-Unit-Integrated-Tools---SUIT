package services_test

import (
	"backend/database"
	"backend/models"
	"backend/services"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// setupTestDB initializes an in-memory database for testing
func setupTestDB() {
	db, _ := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	db.AutoMigrate(&models.Unit{}, &models.Customer{})
	database.DB = db
}

func TestGenerateInventoryReport(t *testing.T) {
	setupTestDB()

	// Seed test data
	testUnits := []models.Unit{
		{
			UnitNumber: "A1",
			SizeType:   "5x5",
			Length:     5,
			Width:      5,
			Price:      100.0,
			Status:     "Available",
		},
		{
			UnitNumber: "A2",
			SizeType:   "5x5",
			Length:     5,
			Width:      5,
			Price:      100.0,
			Status:     "Occupied",
			CustomerID: uintPtr(1), // Helper to simulate occupied
		},
	}
	database.DB.Create(&testUnits)

	rows, err := services.GenerateInventoryReport()

	assert.NoError(t, err)
	assert.Len(t, rows, 1) // Both are 5x5, so 1 group
	assert.Equal(t, 2, rows[0].TotalRooms)
	assert.Equal(t, 1, rows[0].Occupied)
	assert.Equal(t, 1, rows[0].Vacant)
	assert.Equal(t, 200.0, rows[0].GrossIncome)
	assert.Equal(t, 50.0, rows[0].PercentUtil)
}

func TestExportInventoryPDF(t *testing.T) {
	// Sample data for PDF generation
	rows := []services.InventoryReportRow{
		{
			Size:        "10x10",
			Description: "Large Unit",
			SqFt:        100,
			Rent:        150.0,
			TotalRooms:  5,
			Occupied:    2,
			Vacant:      3,
			GrossIncome: 750.0,
			PercentUtil: 40.0,
		},
	}

	pdfBytes, err := services.ExportInventoryPDF(rows)

	assert.NoError(t, err)
	assert.NotNil(t, pdfBytes)
	assert.True(t, len(pdfBytes) > 0)
}

func TestGenerateLockoutReport(t *testing.T) {
	setupTestDB()

	// Seed a deactivated unit that has NOT been reported
	due := time.Now().AddDate(0, 0, -5)
	unit := models.Unit{
		UnitNumber:      "L1",
		Status:          models.UnitStatusDeactivated,
		LockoutReported: false,
		NextDueDate:     &due,
		Price:           50.0,
	}
	database.DB.Create(&unit)

	pdfBytes, err := services.GenerateLockoutReport()

	assert.NoError(t, err)
	assert.NotNil(t, pdfBytes)
}

func TestExportLockoutPDF(t *testing.T) {
	// Test PDF generation with mock models
	units := []models.Unit{
		{
			UnitNumber: "B2",
			SizeType:   "10x20",
			Length:     10,
			Width:      20,
			Height:     10,
			Price:      200.0,
			Status:     "Deactivated",
		},
	}

	pdfBytes, err := services.ExportLockoutPDF(units)

	assert.NoError(t, err)
	assert.NotEmpty(t, pdfBytes)
}

// Helper function for pointers
func uintPtr(i uint) *uint {
	return &i
}
