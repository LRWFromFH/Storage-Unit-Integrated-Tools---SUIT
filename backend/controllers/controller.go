package controllers

import (
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"backend/utilities"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	EmployeeID uint   `json:"employee_id"`
	Role       string `json:"role"`
	jwt.RegisteredClaims
}

func JwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-do-not-use-in-production"
	}
	return []byte(secret)
}

func Register(c *gin.Context) {
	var req models.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := utilities.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	employee := models.Employee{
		SMID:     req.SMID,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     "employee",
	}

	result := database.DB.Create(&employee)
	if result.Error != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email or username already exists"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered", "user": employee})
}

func Login(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var employee models.Employee
	result := database.DB.Where("email = ?", req.Email).First(&employee)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := utilities.CheckPasswordHash(req.Password, employee.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		EmployeeID: employee.ID,
		Role:       employee.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	csrfToken, _ := utilities.GenerateToken()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(JwtSecret())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.SetCookie(
		"session_token", // cookie name
		tokenString,     // the JWT value
		86400,           // maxAge in seconds (24h to match your JWT expiry)
		"/",             // path — available on all routes
		"",              // domain — empty means current domain
		false,           // secure — set to true in production (HTTPS only)
		true,            // httpOnly — JS cannot read this cookie
	)
	c.SetCookie("csrf_token", csrfToken, 86400, "/", "", false, false)

	//TODO: Add session to database.

	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}
func Logout(c *gin.Context) {
	// MaxAge = -1 tells the browser to delete the cookie immediately
	c.SetCookie("session_token", "", -1, "/", "", false, true)
	c.SetCookie("csrf_token", "", -1, "/", "", false, false)

	//TODO: Remove session from database.

	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

// TODO: Session API endpoint to validate session and return user info.
func Session(c *gin.Context) {
	employeeID, _ := c.Get("employee_id")
	role, _ := c.Get("role")
	c.JSON(http.StatusOK, gin.H{
		"employee_id": employeeID,
		"role":        role,
	})
}

func SearchDB(c *gin.Context) {
	var req models.SearchRequest
	// Bind the incoming JSON to our struct
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	searchQuery := req.Query
	// Create a wildcard string for partial matches: e.g., "John" becomes "%John%"
	likeQuery := "%" + searchQuery + "%"

	var customers []models.Customer
	var units []models.Unit

	// 1. Search Customers by Name (First, Last, or Full), Email, or Phone
	database.DB.Where(
		"first_name LIKE ? OR last_name LIKE ? OR first_name || ' ' || last_name LIKE ? OR email LIKE ? OR phone LIKE ?",
		likeQuery, likeQuery, likeQuery, likeQuery, likeQuery,
	).Find(&customers)

	// 2. Search Units by Unit Number/ID
	// If unit_id is a string/varchar, use LIKE. If it's an integer, use =.
	database.DB.Where("Unit_Number LIKE ?", likeQuery).Find(&units)

	c.JSON(http.StatusOK, gin.H{
		"customers": customers,
		"units":     units,
	})
}

// Customer CRUD Functions

// GetAllCustomers gets all customers with their units
func GetAllCustomers(c *gin.Context) {
	var customers []models.Customer

	// Preload units for each customer
	result := database.DB.Preload("Units").Find(&customers)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"customers": customers})
}

// GetCustomer gets a specific customer by ID with their units
func GetCustomer(c *gin.Context) {
	id := c.Param("id")

	// Convert string ID to uint
	customerID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var customer models.Customer
	result := database.DB.Preload("Units").First(&customer, customerID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"customer": customer})
}

// CreateCustomer creates a new customer
func CreateCustomer(c *gin.Context) {
	var customer models.Customer

	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := database.DB.Create(&customer)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Customer created successfully", "customer": customer})
}

// UpdateCustomer updates an existing customer
func UpdateCustomer(c *gin.Context) {
	id := c.Param("id")

	// Convert string ID to uint
	customerID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var customer models.Customer
	result := database.DB.First(&customer, customerID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// Bind the updated data
	var updateData models.Customer
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update customer fields
	customer.FirstName = updateData.FirstName
	customer.LastName = updateData.LastName
	customer.Phone = updateData.Phone
	customer.Address = updateData.Address
	customer.Email = updateData.Email

	result = database.DB.Save(&customer)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer updated successfully", "customer": customer})
}

// DeleteCustomer deletes a customer (with cascade delete for units)
func DeleteCustomer(c *gin.Context) {
	id := c.Param("id")

	// Convert string ID to uint
	customerID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var customer models.Customer
	result := database.DB.First(&customer, customerID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// Delete the customer (GORM will handle cascade delete if configured properly)
	result = database.DB.Delete(&customer)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete customer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer deleted successfully"})
}

// GetCustomerUnits gets all units for a specific customer
func GetCustomerUnits(c *gin.Context) {
	id := c.Param("id")

	// Convert string ID to uint
	customerID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var customer models.Customer
	result := database.DB.First(&customer, customerID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	var units []models.Unit
	result = database.DB.Where("customer_id = ?", customerID).Find(&units)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch units"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"units": units})
}

// Fetch available units
func GetAvailableUnits(c *gin.Context) {
	var units []models.Unit

	result := database.DB.Where("customer_id IS NULL").Find(&units)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch available units"})
	}

	c.JSON(http.StatusOK, gin.H{"units": units})
}

func CreateUnit(c *gin.Context) {
	var unit models.Unit
	if err := c.ShouldBindJSON(&unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}
	result := database.DB.Create(&unit)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
		return
	}
}

func GetUnit(c *gin.Context) {
	unitNumber := c.Param("unit_number")

	var unit models.Unit
	result := database.DB.Where("unit_number = ?", unitNumber).First(&unit)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}
	c.JSON(http.StatusOK, unit)
}

func UpdateUnit(c *gin.Context) {
	unitNumber := c.Param("unit_number")

	var unit models.Unit
	result := database.DB.Where("unit_number = ?", unitNumber).First(&unit)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}

	// Bind the updated data
	var updateData models.Unit
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	unit.UnitNumber = updateData.UnitNumber
	unit.SizeType = updateData.SizeType
	unit.Price = updateData.Price
	unit.CustomerID = updateData.CustomerID
	unit.Renter = updateData.Renter
	unit.Insurance = updateData.Insurance
	database.DB.Save(&unit)
	c.JSON(http.StatusOK, unit)
}

func DeleteUnit(c *gin.Context) {
	unitNumber := c.Param("unit_number")

	var unit models.Unit
	result := database.DB.Where("unit_number = ?", unitNumber).First(&unit)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}

	database.DB.Delete(&unit)

	c.JSON(http.StatusOK, gin.H{"message": "Unit deleted successfully"})
}

// This function expects the frontend to send additional delete requests
// to delete the combined units from the database
func CombineUnits(c *gin.Context) {
	var combineRequest models.UnitCombineRequest

	//Get request
	if err := c.ShouldBindJSON(&combineRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	//Get units in request
	var units []models.Unit
	result := database.DB.Where("id IN ?", combineRequest.UnitIDs).Find(&units)
	if result.Error != nil || len(units) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "One or more units not found"})
		return
	}

	//Make sure that the request is more than one unit
	if len(units) <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least two units must be selected for combination"})
		return
	}

	// Check if all units belong to the same customer (if they have customer IDs)
	var length, width int
	length = 0
	width = 0
	unitNumbers := make([]string, len(units))

	for i, unit := range units {
		if unit.CustomerID != &combineRequest.CustomerID && unit.CustomerID != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "All units must belong to the same customer"})
			return
		}
		length += unit.Length
		width += unit.Width
		unitNumbers[i] = unit.UnitNumber
	}
	combinedUnitNumber := strings.Join(unitNumbers, "-")

	//Assign cutomerID as it will be either nil or a single customer
	var combinedUnit models.Unit
	combinedUnit.CustomerID = &combineRequest.CustomerID
	combinedUnit.Combined = true
	combinedUnit.Height = 10
	combinedUnit.Length = length
	combinedUnit.Width = width
	combinedUnit.UnitNumber = combinedUnitNumber
	combinedUnit.CombinedFrom = strings.Join(unitNumbers, ",")
	combinedUnit.SizeType = strconv.Itoa(length) + "x" + strconv.Itoa(width)
	combinedUnit.Price = combineRequest.Price
	database.DB.Create(&combinedUnit)

	c.JSON(http.StatusOK, combinedUnit)
}
