package controllers_test

import (
	"backend/database"
	"backend/models"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// Create a customer, make units,
func boilerplate(t *testing.T, input any, req_type string, api string, r *gin.Engine) map[string]interface{} {
	// Create test data

	registerUser(r, map[string]string{
		"username": "logout_protect_test",
		"email":    "logoutprotect@test.com",
		"password": "securepassword123",
	})

	loginResp := loginUser(r, map[string]string{
		"email":    "logoutprotect@test.com",
		"password": "securepassword123",
	})

	data := input
	jsonData, _ := json.Marshal(data)

	req, _ := http.NewRequest(req_type, "/api/"+api, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	csrfToken := getCSRFToken(loginResp)
	if csrfToken == "" {
		t.Fatal("No csrf_token cookie in login response")
	}
	//t.Logf("CSRF Token: %s", csrfToken)
	req.Header.Set("X-CSRF-TOKEN", csrfToken)
	attachCookies(req, loginResp)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// After r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	return response
	// 1. Get the customers list from the response map
}

func TestGetAllCustomers(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)
	unit := models.Unit{
		UnitNumber: "A123",
		SizeType:   "10x10",
		Renter:     &customer,
		CustomerID: &customer.ID,
	}
	database.DB.Create(&unit)

	var response = boilerplate(t, "", "GET", "customers", r)
	// 1. Get the customers list from the response map
	customers, ok := response["customers"].([]interface{})
	if !ok || len(customers) == 0 {
		t.Fatal("No customers found in the search response")
	}

	// 2. Access the first customer in the list
	firstCustomer, ok := customers[0].(map[string]interface{})
	if !ok {
		t.Fatal("Customer data is not in the expected format")
	}

	// 3. Access the names using the correct JSON keys (lowercase with underscores)
	firstName := firstCustomer["FirstName"]
	lastName := firstCustomer["LastName"]

	t.Logf("Found Customer Name: %v %v", firstName, lastName)
}

func TestGetCustomer(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)
	unit := models.Unit{
		UnitNumber: "A123",
		SizeType:   "10x10",
		Renter:     &customer,
		CustomerID: &customer.ID,
	}
	database.DB.Create(&unit)

	var response = boilerplate(t, "", "GET", "customers/1", r)
	// 1. Get the customers list from the response map
	// 2. Access the first customer in the list
	firstCustomer, ok := response["customer"].(map[string]interface{})
	if !ok {
		t.Fatal("Customer data is not in the expected format")
	}

	// 3. Access the names using the correct JSON keys (lowercase with underscores)
	firstName := firstCustomer["FirstName"]
	lastName := firstCustomer["LastName"]

	t.Logf("Found Customer Name: %v %v", firstName, lastName)
}

func TestUpdateCustomer(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)
	unit := models.Unit{
		UnitNumber: "A123",
		SizeType:   "10x10",
		Renter:     &customer,
		CustomerID: &customer.ID,
	}
	database.DB.Create(&unit)
	customer.FirstName = "James"
	unit.Renter = &customer

	updatePayload := gin.H{
		"FirstName": customer.FirstName,
	}

	var response = boilerplate(t, updatePayload, "POST", "customers/1", r)
	// 1. Get the customers list from the response map
	// 2. Access the first customer in the list
	firstCustomer, ok := response["customer"].(map[string]interface{})
	if !ok {
		t.Fatal("Customer data is not in the expected format")
	}

	// 3. Access the names using the correct JSON keys (lowercase with underscores)
	firstName := firstCustomer["FirstName"]
	lastName := firstCustomer["LastName"]

	t.Logf("Found Customer Name: %v %v", firstName, lastName)
}

func TestCreateCustomer(t *testing.T) {
	r := setupTestRouter()

	updatePayload := gin.H{
		"FirstName": "John",
		"LastName":  "Doe",
		"Address":   "11490 San Jose Blvd",
		"Email":     "john.doe@email.com",
		"Phone":     "123-456-7890",
	}

	var response = boilerplate(t, updatePayload, "POST", "customers", r)
	// 1. Get the customers list from the response map
	// 2. Access the first customer in the list
	firstCustomer, ok := response["customer"].(map[string]interface{})
	if !ok {
		t.Fatal("Customer data is not in the expected format")
	}

	// 3. Access the names using the correct JSON keys (lowercase with underscores)
	firstName := firstCustomer["FirstName"]
	lastName := firstCustomer["LastName"]

	t.Logf("Found Customer Name: %v %v", firstName, lastName)
}

func TestDeleteCustomer(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)

	var _ = boilerplate(t, "", "DELETE", "customers/1", r)
}

func TestGetCustomerUnits(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)
	unit := models.Unit{
		UnitNumber: "A123",
		SizeType:   "10x10",
		Renter:     &customer,
		CustomerID: &customer.ID,
	}
	database.DB.Create(&unit)
	unit = models.Unit{
		UnitNumber: "A124",
		SizeType:   "10x10",
		Renter:     &customer,
		CustomerID: &customer.ID,
	}
	database.DB.Create(&unit)

	var response = boilerplate(t, "", "GET", "customers/1/units", r)
	// 1. Get the customers list from the response map
	units, ok := response["units"].([]interface{})
	if !ok || len(units) == 0 {
		t.Fatal("No customers found in the search response")
	}

	// 2. Access the first customer in the list
	firstUnit, ok := units[1].(map[string]interface{})
	if !ok {
		t.Fatal("Customer data is not in the expected format")
	}

	// 3. Access the names using the correct JSON keys (lowercase with underscores)
	unitNumber := firstUnit["UnitNumber"]
	sizeType := firstUnit["SizeType"]

	t.Logf("Found Customer Name: %v %v", unitNumber, sizeType)
}

func TestGetAllUnits(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)
	unit := models.Unit{
		UnitNumber: "A123",
		SizeType:   "10x10",
		Renter:     nil,
		CustomerID: nil,
	}
	database.DB.Create(&unit)

	var response = boilerplate(t, "", "GET", "AvailableUnits", r)
	// 1. Get the customers list from the response map
	units, ok := response["units"].([]interface{})
	if !ok || len(units) == 0 {
		t.Fatal("No customers found in the search response")
	}

	// 2. Access the first customer in the list
	firstUnit, ok := units[1].(map[string]interface{})
	if !ok {
		t.Fatal("Customer data is not in the expected format")
	}

	// 3. Access the names using the correct JSON keys (lowercase with underscores)
	unitNumber := firstUnit["UnitNumber"]
	sizeType := firstUnit["SizeType"]

	t.Logf("Found Customer Name: %v %v", unitNumber, sizeType)
}

func TestGetUnit(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)
	unit := models.Unit{
		UnitNumber: "A123",
		SizeType:   "10x10",
		Renter:     &customer,
		CustomerID: &customer.ID,
	}
	database.DB.Create(&unit)

	var response = boilerplate(t, "", "GET", "units/A123", r)
	// 1. Get the customers list from the response map
	// 2. Access the first customer in the list
	firstUnit, ok := response["unit"].(map[string]interface{})
	if !ok {
		t.Fatal("Customer data is not in the expected format")
	}

	// 3. Access the names using the correct JSON keys (lowercase with underscores)
	unitNumber := firstUnit["UnitNumber"]
	sizeType := firstUnit["SizeType"]

	t.Logf("Found Customer Name: %v %v", unitNumber, sizeType)
}

func TestUpdateUnit(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)
	unit := models.Unit{
		UnitNumber: "A123",
		SizeType:   "10x10",
		Renter:     &customer,
		CustomerID: &customer.ID,
	}
	database.DB.Create(&unit)

	updatePayload := gin.H{
		"UnitNumber": "A124",
	}

	var response = boilerplate(t, updatePayload, "POST", "units/A123", r)
	// 1. Get the customers list from the response map
	// 2. Access the first customer in the list
	firstUnit, ok := response["unit"].(map[string]interface{})
	if !ok {
		t.Fatal("Customer data is not in the expected format")
	}

	// 3. Access the names using the correct JSON keys (lowercase with underscores)
	unitNumber := firstUnit["UnitNumber"]
	sizeType := firstUnit["SizeType"]

	t.Logf("Found Customer Name: %v %v", unitNumber, sizeType)
}

func TestCreateUnit(t *testing.T) {
	r := setupTestRouter()

	updatePayload := gin.H{
		"UnitNumber": "A123",
		"SizeType":   "10x10",
		"Renter":     nil,
		"CustomerID": nil,
	}

	var response = boilerplate(t, updatePayload, "POST", "units", r)
	// 1. Get the customers list from the response map
	// 2. Access the first customer in the list
	firstUnit, ok := response["unit"].(map[string]interface{})
	if !ok {
		t.Fatal("Customer data is not in the expected format")
	}

	// 3. Access the names using the correct JSON keys (lowercase with underscores)
	unitNumber := firstUnit["UnitNumber"]
	sizeType := firstUnit["SizeType"]

	t.Logf("Found Customer Name: %v %v", unitNumber, sizeType)
}

func TestDeleteUnit(t *testing.T) {
	r := setupTestRouter()

	unit := models.Unit{
		UnitNumber: "A123",
		SizeType:   "10x10",
		Renter:     nil,
		CustomerID: nil,
	}
	database.DB.Create(&unit)

	var _ = boilerplate(t, "", "DELETE", "units/A123", r)
}

func TestGetNotes(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)

	note := models.Note{
		CustomerID: customer.ID,
		Content:    "Test note content",
		AuthorID:   1,
	}
	database.DB.Create(&note)

	var response = boilerplate(t, "", "GET", "customers/1/notes", r)

	notes, ok := response["notes"].([]interface{})
	if !ok || len(notes) == 0 {
		t.Fatal("No notes found in response")
	}

	firstNote, ok := notes[0].(map[string]interface{})
	if !ok {
		t.Fatal("Note data is not in the expected format")
	}

	t.Logf("Found note: %v", firstNote["Content"])
}

//func TestCombineUnits(t *testing.T) {
//	r := setupTestRouter()
//
//	customer := models.Customer{
//		FirstName: "John",
//		LastName:  "Doe",
//		Address:   "11490 San Jose Blvd",
//		Email:     "john.doe@email.com",
//		Phone:     "123-456-7890",
//	}
//	database.DB.Create(&customer)
//	unit := models.Unit{
//		UnitNumber: "A123",
//		SizeType:   "10x10",
//		Renter:     &customer,
//		CustomerID: &customer.ID,
//	}
//	database.DB.Create(&unit)
//	unit = models.Unit{
//		UnitNumber: "A124",
//		SizeType:   "10x10",
//		Renter:     &customer,
//		CustomerID: &customer.ID,
//	}
//	database.DB.Create(&unit)
//
//	var response = boilerplate(t, "", "GET", "customers/1/units", r)
//	// 1. Get the customers list from the response map
//	units, ok := response["units"].([]interface{})
//	if !ok || len(units) == 0 {
//		t.Fatal("No customers found in the search response")
//	}
//
//	// 2. Access the first customer in the list
//	firstUnit, ok := units[1].(map[string]interface{})
//	if !ok {
//		t.Fatal("Customer data is not in the expected format")
//	}
//
//	// 3. Access the names using the correct JSON keys (lowercase with underscores)
//	unitNumber := firstUnit["UnitNumber"]
//	sizeType := firstUnit["SizeType"]
//
//	t.Logf("Found Customer Name: %v %v", unitNumber, sizeType)
//}
