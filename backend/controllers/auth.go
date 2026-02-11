package controllers

import (
	"net/http"

	"backend/database"
	"backend/models"
	"backend/utilities"

	"github.com/gin-gonic/gin"
)

func Register(c *gin.Context) {
	var employee models.Employee
	var err error

	if err := c.ShouldBindJSON(&employee); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	//TODO: Hash password before saving to database
	employee.Password, err = utilities.HashPassword(employee.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	database.DB.Create(&employee)
	c.JSON(http.StatusOK, gin.H{"message": "User registered"})
}

func Login(c *gin.Context) {
	var loginData models.Employee
	var employee *models.Employee = nil
	var err error

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	employee, err = database.GenericLookup[models.Employee]("smid", loginData.SMID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if employee.ID == 0 || utilities.CheckPasswordHash(loginData.Password, employee.Password) == false {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
	//TODO: Generate and return a session token or JWT for authenticated requests
	//TODO: Generate a cookie with the session token and set it in the response header
}
