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

	DB.AutoMigrate(&models.Customer{},
		&models.Employee{},
		&models.Unit{}, &models.Session{})
	//&models.RegisterRequest{},
	//&models.LoginRequest{}, &models.CreateUnitRequest{})
}

func ConnectTest() {
	var err error
	DB, err = gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to test database:", err)
	}

	DB.AutoMigrate(&models.Employee{},
		&models.Unit{},
		&models.Customer{},
		&models.RegisterRequest{},
		&models.LoginRequest{},
		&models.CreateUnitRequest{},
		&models.Session{})
}
