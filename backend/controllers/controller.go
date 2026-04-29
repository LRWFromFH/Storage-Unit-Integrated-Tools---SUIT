package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"backend/services"
	"backend/utilities"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	EmployeeID uint   `json:"employee_id"`
	Role       string `json:"role"`
	jwt.RegisteredClaims
}

var defaultTimeoutLength int = 30

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

	expirationTime := time.Now().Add(time.Duration(defaultTimeoutLength) * time.Minute)
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
	var session models.Session
	session.Token = tokenString
	session.EmployeeID = claims.EmployeeID
	session.Expiration = time.Now().Add(time.Duration(defaultTimeoutLength) * time.Minute)
	database.DB.Create(&session)

	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}
func Logout(c *gin.Context) {
	// 1. Manually get the token string from the cookie
	tokenString, err := c.Cookie("session_token")
	if err != nil {
		//fmt.Println("Could not read Cookie!")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session cookie found"})
		return
	}

	// 2. Parse the JWT claims directly
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return JwtSecret(), nil
	})

	// 3. Validate the token and claims
	if err != nil || !token.Valid {
		//fmt.Println("Could not validate token!")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	// Now you have access to claims.EmployeeID and tokenString
	var session models.Session
	result := database.DB.Where("token = ? AND employee_id = ?", tokenString, claims.EmployeeID).First(&session)
	if result.Error == nil {
		database.DB.Delete(&session)
	}

	// MaxAge = -1 tells the browser to delete the cookie immediately
	c.SetCookie("session_token", "", -1, "/", "", false, true)
	c.SetCookie("csrf_token", "", -1, "/", "", false, false)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

// TODO: Session API endpoint to validate session and return user info.
func Session(c *gin.Context) {
	// 1. Manually get the token string from the cookie
	tokenString, err := c.Cookie("session_token")
	if err != nil {
		//fmt.Println("Could not read Cookie!")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session cookie found"})
		return
	}

	// 2. Parse the JWT claims directly
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return JwtSecret(), nil
	})

	// 3. Validate the token and claims
	if err != nil || !token.Valid {
		//fmt.Println("Could not validate token!")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	// Now you have access to claims.EmployeeID and tokenString
	var session models.Session
	result := database.DB.Where("token = ? AND employee_id = ?", tokenString, claims.EmployeeID).First(&session)

	if result.Error != nil {
		Logout(c)
		//c.JSON(http.StatusUnauthorized, gin.H{"error": "No active session in database"})
		return
	}

	// Check expiration logic
	if session.Expiration.Before(time.Now()) {
		database.DB.Delete(&session)
		Logout(c)
		//c.JSON(http.StatusUnauthorized, gin.H{"error": "Session expired"})
		return
	}

	// Extend session
	session.Expiration = time.Now().Add(time.Duration(defaultTimeoutLength) * time.Minute)
	database.DB.Save(&session)

	c.JSON(http.StatusOK, gin.H{
		"employee_id": claims.EmployeeID,
		"expires_at":  session.Expiration,
	})
}

func UpdateEmployeeRole(c *gin.Context) {
	id := c.Param("id")
	employeeID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid employee id"})
		return
	}

	var req models.RoleUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Role != "manager" && req.Role != "employee" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}

	var employee models.Employee
	if result := database.DB.First(&employee, employeeID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
		return
	}

	employee.Role = req.Role
	database.DB.Save(&employee)
	c.JSON(http.StatusOK, gin.H{"message": "role updated", "employee": employee})
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
	customerID, err := strconv.ParseUint(id, 10, 64)
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

	c.JSON(http.StatusOK, gin.H{"message": "Customer created successfully", "customer": customer})
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

// Fetch all units (occupied + available) — manager only
func GetAllUnits(c *gin.Context) {
	var units []models.Unit

	result := database.DB.Find(&units)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch units"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"units": units})
}

// Fetch all employees — manager only
func GetAllEmployees(c *gin.Context) {
	var employees []models.Employee

	result := database.DB.Find(&employees)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employees"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"employees": employees})
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
	c.JSON(http.StatusOK, gin.H{"unit": unit})
}

func GetUnit(c *gin.Context) {
	unitNumber := c.Param("unit_number")

	var unit models.Unit
	result := database.DB.Where("unit_number = ?", unitNumber).First(&unit)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"unit": unit})
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
	c.JSON(http.StatusOK, gin.H{"unit": unit})
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

// func GetNotes(c *gin.Context) {
// 	id := c.Param("id")
// 	customerID, err := strconv.ParseUint(id, 10, 64)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
// 		return
// 	}

// 	var notes []models.Note
// 	result := database.DB.Where("customer_id = ?", customerID).Find(&notes)
// 	if result.Error != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notes"})
// 		return
// 	}

// 	c.JSON(http.StatusOK, gin.H{"notes": notes})
// }

func CreateNote(c *gin.Context) {
	id := c.Param("id")
	customerID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	authorID, _ := c.Get("employee_id")

	var req models.NoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	note := models.Note{
		CustomerID: uint(customerID),
		Content:    req.Content,
		AuthorID:   authorID.(uint),
	}

	result := database.DB.Create(&note)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create note"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"note": note})
}

// func DeleteNote(c *gin.Context) {
// 	id := c.Param("id")
// 	nid := c.Param("nid")

// 	customerID, err := strconv.ParseUint(id, 10, 64)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
// 		return
// 	}

// 	noteID, err := strconv.ParseUint(nid, 10, 64)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
// 		return
// 	}

// 	var note models.Note
// 	result := database.DB.Where("id = ? AND customer_id = ?", noteID, customerID).First(&note)
// 	if result.Error != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
// 		return
// 	}

// 	callerID, _ := c.Get("employee_id")
// 	callerRole, _ := c.Get("role")

// 	if note.AuthorID != callerID.(uint) && callerRole.(string) != "manager" {
// 		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
// 		return
// 	}

// 	database.DB.Delete(&note)
// 	c.JSON(http.StatusOK, gin.H{"message": "Note deleted successfully"})
// }

// Insurance handlers

// func GetInsurance(c *gin.Context) {
// 	unitNumber := c.Param("unit_number")

// 	var unit models.Unit
// 	result := database.DB.Where("unit_number = ?", unitNumber).First(&unit)
// 	if result.Error != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
// 		return
// 	}

// 	var insurance models.Insurance
// 	result = database.DB.Where("unit_id = ?", unit.ID).First(&insurance)
// 	if result.Error != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "No insurance found for this unit"})
// 		return
// 	}

// 	c.JSON(http.StatusOK, gin.H{"insurance": insurance})
// }

func UpsertInsurance(c *gin.Context) {
	unitNumber := c.Param("unit_number")

	var unit models.Unit
	result := database.DB.Where("unit_number = ?", unitNumber).First(&unit)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}

	var req models.InsuranceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var insurance models.Insurance
	database.DB.Where("unit_id = ?", unit.ID).First(&insurance)

	insurance.UnitID = unit.ID
	insurance.ProviderName = req.ProviderName
	insurance.PolicyNumber = req.PolicyNumber
	insurance.CoverageLimit = req.CoverageLimit
	insurance.ExpiryDate = req.ExpiryDate

	database.DB.Save(&insurance)
	c.JSON(http.StatusOK, gin.H{"insurance": insurance})
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

	//Assign customerID only when a real customer was specified (0 means none provided)
	var combinedUnit models.Unit
	if combineRequest.CustomerID != 0 {
		combinedUnit.CustomerID = &combineRequest.CustomerID
	}
	combinedUnit.Combined = true
	combinedUnit.Height = 10
	combinedUnit.Length = length
	combinedUnit.Width = width
	combinedUnit.UnitNumber = combinedUnitNumber
	combinedUnit.CombinedFrom = strings.Join(unitNumbers, ",")
	combinedUnit.SizeType = strconv.Itoa(length) + "x" + strconv.Itoa(width)
	combinedUnit.Price = combineRequest.Price
	if err := database.DB.Create(&combinedUnit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create combined unit: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, combinedUnit)
}

func GetCustomerBalance(c *gin.Context) {
	id := c.Param("id")

	// Convert string ID to uint
	customerID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var customer models.Customer

	if err := database.DB.First(&customer, customerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	balance, err := services.GetCustomerBalance(uint(customerID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"balance": balance})
}

func GetTransactions(c *gin.Context) {
	id := c.Param("id")

	// Convert string ID to uint
	customerID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var transactions []models.LedgerEntry
	// Preload("Invoice") if you want to see the invoice details in the list
	result := database.DB.Where("customer_id = ?", customerID).Find(&transactions)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"transactions": transactions})
}

func PostCharge(c *gin.Context) {
	type ChargeRequest struct {
		CustomerID  uint    `json:"customer_id" binding:"required"`
		UnitID      uint    `json:"unit_id" binding:"required"`
		Amount      float64 `json:"amount" binding:"required"`
		Description string  `json:"description"`
	}

	var req ChargeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customer models.Customer
	if err := database.DB.First(&customer, req.CustomerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	var unit models.Unit
	if err := database.DB.First(&unit, req.UnitID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}

	if err := services.CreateCharge(customer.ID, unit.ID, req.Amount, req.Description); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Charge created successfully"})
}

func PostCustomerPayment(c *gin.Context) {

	type PaymentRequest struct {
		CustomerID  uint    `json:"customer_id" binding:"required"`
		Unit        uint    `json:"unit_id"`
		Amount      float64 `json:"amount" binding:"required"`
		Description string  `json:"description"`
	}

	var req PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customer models.Customer
	if err := database.DB.First(&customer, req.CustomerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}
	var unit models.Unit
	if err := database.DB.First(&unit, req.Unit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}

	result := services.RecordPayment(customer.ID, unit.ID, req.Amount, req.Description)
	if result != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment accepted."})
}

// Notes Controllers

func GetNotes(c *gin.Context) {
	id := c.Param("id")
	customerID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var notes []models.Note
	if err := database.DB.Where("customer_id = ?", customerID).Find(&notes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notes"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"notes": notes})
}

func PostNote(c *gin.Context) {
	id := c.Param("id")
	customerID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	employeeIDVal, exists := c.Get("employee_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	employeeID := employeeIDVal.(uint)

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	note := models.Note{
		CustomerID: uint(customerID),
		Content:    req.Content,
		AuthorID:   employeeID,
	}
	if err := database.DB.Create(&note).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create note"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"note": note})
}

func DeleteNote(c *gin.Context) {
	id := c.Param("id")
	customerID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	noteIDStr := c.Param("note_id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	employeeIDVal, exists := c.Get("employee_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	employeeID := employeeIDVal.(uint)

	roleVal, _ := c.Get("role")
	role, _ := roleVal.(string)

	var note models.Note
	if err := database.DB.Where("id = ? AND customer_id = ?", noteID, customerID).First(&note).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	if note.AuthorID != employeeID && role != "manager" {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own notes"})
		return
	}

	if err := database.DB.Delete(&note).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Note deleted"})
}

// Insurance Controllers

func GetInsurance(c *gin.Context) {
	unitNumber := c.Param("unit_number")

	var unit models.Unit
	if err := database.DB.Where("unit_number = ?", unitNumber).First(&unit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}

	var insurance models.Insurance
	if err := database.DB.Where("unit_id = ?", unit.ID).First(&insurance).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No insurance on file"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"insurance": insurance})
}

func PostInsurance(c *gin.Context) {
	unitNumber := c.Param("unit_number")

	var unit models.Unit
	if err := database.DB.Where("unit_number = ?", unitNumber).First(&unit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Unit not found"})
		return
	}

	var req struct {
		ProviderName  string  `json:"provider_name" binding:"required"`
		PolicyNumber  string  `json:"policy_number" binding:"required"`
		CoverageLimit float64 `json:"coverage_limit" binding:"required"`
		ExpiryDate    string  `json:"expiry_date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	expiryDate, err := time.Parse(time.RFC3339, req.ExpiryDate)
	if err != nil {
		// Try date-only format as fallback
		expiryDate, err = time.Parse("2006-01-02", req.ExpiryDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expiry_date format. Use ISO 8601."})
			return
		}
	}

	var insurance models.Insurance
	result := database.DB.Where("unit_id = ?", unit.ID).First(&insurance)

	insurance.UnitID = unit.ID
	insurance.ProviderName = req.ProviderName
	insurance.PolicyNumber = req.PolicyNumber
	insurance.CoverageLimit = req.CoverageLimit
	insurance.ExpiryDate = expiryDate

	if result.Error != nil {
		// No existing record — create
		if err := database.DB.Create(&insurance).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save insurance"})
			return
		}
	} else {
		// Existing record — update
		if err := database.DB.Save(&insurance).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update insurance"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"insurance": insurance})
}

func MoveOut(c *gin.Context) {
	unitNumber := c.Param("unit_number")

	var unit models.Unit
	if err := database.DB.Where("unit_number = ?", unitNumber).First(&unit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "unit not found"})
		return
	}

	if unit.CustomerID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unit has no current renter"})
		return
	}

	customerID := *unit.CustomerID
	sizeType := unit.SizeType

	updates := map[string]interface{}{
		"customer_id":   nil,
		"next_due_date": nil,
		"status":        models.UnitStatusNormal,
	}
	if err := database.DB.Model(&unit).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process move-out"})
		return
	}

	database.DB.Model(&models.Reservation{}).
		Where("customer_id = ? AND size_type = ? AND status = ?", customerID, sizeType, models.ReservationStatusActive).
		Update("status", models.ReservationStatusCancelled)

	c.JSON(http.StatusOK, gin.H{"message": "move-out complete", "unit": unit})
}

func AssignCustomerToUnit(c *gin.Context) {
	unitNumber := c.Param("unit_number")

	var unit models.Unit
	if err := database.DB.Where("unit_number = ?", unitNumber).First(&unit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "unit not found"})
		return
	}

	var req models.AssignCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customer models.Customer
	if err := database.DB.First(&customer, req.CustomerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "customer not found"})
		return
	}

	dueDate := time.Now().AddDate(0, 0, 30)
	updates := map[string]interface{}{
		"customer_id":   &req.CustomerID,
		"next_due_date": &dueDate,
		"status":        models.UnitStatusNormal,
	}
	if err := database.DB.Model(&unit).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign customer"})
		return
	}

	database.DB.Model(&models.Reservation{}).
		Where("customer_id = ? AND size_type = ? AND status = ?", req.CustomerID, unit.SizeType, models.ReservationStatusActive).
		Update("status", models.ReservationStatusFulfilled)

	c.JSON(http.StatusOK, gin.H{"unit": unit})
}

func CreateReservation(c *gin.Context) {
	var req models.CreateReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customer models.Customer
	if err := database.DB.First(&customer, req.CustomerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "customer not found"})
		return
	}

	reservation := models.Reservation{
		CustomerID:   req.CustomerID,
		SizeType:     req.SizeType,
		CardLastFour: req.CardLastFour,
		Status:       models.ReservationStatusActive,
	}
	if err := database.DB.Create(&reservation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create reservation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"reservation": reservation})
}

func CancelReservation(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var reservation models.Reservation
	if err := database.DB.First(&reservation, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "reservation not found"})
		return
	}

	database.DB.Model(&reservation).Update("status", models.ReservationStatusCancelled)
	c.JSON(http.StatusOK, gin.H{"message": "reservation cancelled"})
}

func GetReservations(c *gin.Context) {
	var reservations []models.Reservation
	database.DB.Where("status = ?", models.ReservationStatusActive).Preload("Customer").Find(&reservations)
	c.JSON(http.StatusOK, gin.H{"reservations": reservations})
}

func HandleUtilPDF(c *gin.Context) {
	// Get dynamic data from DB via Service layer
	rows, err := services.GenerateInventoryReport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate report data: " + err.Error()})
		return
	}

	// Generate the PDF bytes
	pdfBytes, err := services.ExportInventoryPDF(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF: " + err.Error()})
		return
	}

	timestamp := time.Now().Format("2006-01-02")
	fileName := fmt.Sprintf("Daily Utility [%s].pdf", timestamp)
	dirPath := "./forms/util"

	// Save a copy to the local machine for inspection
	// Ensure the directory exists (MkdirAll does nothing if it already exists)
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		fmt.Printf("Warning: Could not create local directory: %v\n", err)
	} else {
		filePath := filepath.Join(dirPath, fileName)
		err = os.WriteFile(filePath, pdfBytes, 0644)
		if err != nil {
			fmt.Printf("Warning: Could not save local copy: %v\n", err)
		} else {
			fmt.Printf("Local copy saved to: %s\n", filePath)
		}
	}

	// Set Headers using Gin's context
	// We use "attachment" to prompt a download, or "inline" to view in browser
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Length", fmt.Sprint(len(pdfBytes)))

	// 5. Stream the data
	// c.Data writes the status code, content type, and the byte slice directly to the response body
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}
