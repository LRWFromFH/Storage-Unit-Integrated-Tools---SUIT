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
	DB, err = gorm.Open(sqlite.Open("app.db?_pragma=foreign_keys(1)"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	DB.AutoMigrate(&models.Employee{},
		&models.Unit{},
		&models.Customer{},
		&models.RegisterRequest{},
		&models.LoginRequest{},
		&models.CreateUnitRequest{},
		&models.Session{},
		&models.Invoice{},
		&models.LedgerEntry{},
		&models.Note{},
		&models.Insurance{},
		&models.Reservation{})
	//&models.RegisterRequest{},
	//&models.LoginRequest{}, &models.CreateUnitRequest{})
}

func ConnectTest() {
	var err error
	DB, err = gorm.Open(sqlite.Open("file::memory:?cache=shared&_pragma=foreign_keys(1)"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to test database:", err)
	}

	DB.AutoMigrate(&models.Employee{},
		&models.Unit{},
		&models.Customer{},
		&models.RegisterRequest{},
		&models.LoginRequest{},
		&models.CreateUnitRequest{},
		&models.Session{},
		&models.Invoice{},
		&models.LedgerEntry{},
		&models.Note{},
		&models.Insurance{},
		&models.Reservation{})
}
