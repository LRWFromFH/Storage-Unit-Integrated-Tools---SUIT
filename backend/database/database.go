package database

import (
	"backend/models"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	var err error
	DB, err = gorm.Open(sqlite.Open("app.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	DB.AutoMigrate(&models.Employee{}, &models.Unit{}, &models.Customer{})
}

// T represents the struct type (e.g., Employee)
// This uses reflection determine the table from which to pull data from.
// The condition should only be called internally and should be used with hardcoded column names
// inside the calling function, not with user input, to prevent SQL injection.
// The value is the value to be matched in the query.
// GORM will take care of value sanitization for us.
func GenericLookup[T any](Column string, value string) (*T, error) {
	var result T

	// We use a pointer to 'result' so GORM can populate it
	// Note: We still use 'column' directly, so ensure 'column' is hardcoded in your app
	err := DB.Where(Column+" = ?", value).First(&result).Error

	if err != nil {
		return nil, err
	}

	return &result, nil
}
