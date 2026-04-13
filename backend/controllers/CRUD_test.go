package controllers_test

import (
	"backend/database"
	"backend/models"
	"bytes"
	"encoding/json"
	"fmt"
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

func TestDeleteNote(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)

	registerUser(r, map[string]string{
		"username": "note_author",
		"email":    "note_author@test.com",
		"password": "securepassword123",
	})
	loginResp := loginUser(r, map[string]string{
		"email":    "note_author@test.com",
		"password": "securepassword123",
	})

	var author models.Employee
	database.DB.Where("email = ?", "note_author@test.com").First(&author)

	note := models.Note{
		CustomerID: customer.ID,
		Content:    "Note to be deleted",
		AuthorID:   author.ID,
	}
	database.DB.Create(&note)

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/api/customers/%d/notes/%d", customer.ID, note.ID), nil)
	req.Header.Set("X-CSRF-TOKEN", getCSRFToken(loginResp))
	attachCookies(req, loginResp)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	t.Logf("Delete response: %d", w.Code)
}

func TestDeleteNote_Forbidden(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)

	// AuthorID=999 means a different employee wrote this note
	note := models.Note{
		CustomerID: customer.ID,
		Content:    "Someone else's note",
		AuthorID:   999,
	}
	database.DB.Create(&note)

	// Register and login as a regular employee
	registerUser(r, map[string]string{
		"username": "employee_test",
		"email":    "employee@test.com",
		"password": "securepassword123",
	})
	loginResp := loginUser(r, map[string]string{
		"email":    "employee@test.com",
		"password": "securepassword123",
	})

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/api/customers/%d/notes/%d", customer.ID, note.ID), nil)
	req.Header.Set("X-CSRF-TOKEN", getCSRFToken(loginResp))
	attachCookies(req, loginResp)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("Expected 403, got %d. Body: %s", w.Code, w.Body.String())
	}

	t.Logf("Correctly blocked with status: %d", w.Code)
}

func TestDeleteNote_Manager(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)

	// AuthorID=999 — written by someone else
	note := models.Note{
		CustomerID: customer.ID,
		Content:    "Note written by another employee",
		AuthorID:   999,
	}
	database.DB.Create(&note)

	// Login as manager
	loginResp := loginUser(r, map[string]string{
		"email":    "manager@suit.com",
		"password": "Manager123!",
	})

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/api/customers/%d/notes/%d", customer.ID, note.ID), nil)
	req.Header.Set("X-CSRF-TOKEN", getCSRFToken(loginResp))
	attachCookies(req, loginResp)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	t.Logf("Manager successfully deleted note with status: %d", w.Code)
}

func TestCreateNote(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Address:   "11490 San Jose Blvd",
		Email:     "john.doe@email.com",
		Phone:     "123-456-7890",
	}
	database.DB.Create(&customer)

	payload := gin.H{
		"content": "Customer called about late payment",
	}

	var response = boilerplate(t, payload, "POST", "customers/1/notes", r)

	note, ok := response["note"].(map[string]interface{})
	if !ok {
		t.Fatal("Note data is not in the expected format")
	}

	t.Logf("Created note: %v", note["Content"])
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

func TestGetInsurance(t *testing.T) {
	r := setupTestRouter()

	unit := models.Unit{
		UnitNumber: "INS-TEST-001",
		SizeType:   "10x10",
		Length:     10,
		Width:      10,
		Height:     10,
		Price:      149.95,
		Combined:   false,
	}
	database.DB.Create(&unit)

	insurance := models.Insurance{
		UnitID:        unit.ID,
		ProviderName:  "SafeGuard Insurance",
		PolicyNumber:  "POL-001",
		CoverageLimit: 5000.00,
	}
	database.DB.Create(&insurance)

	var response = boilerplate(t, "", "GET", "units/INS-TEST-001/insurance", r)

	ins, ok := response["insurance"].(map[string]interface{})
	if !ok {
		t.Fatal("Insurance data is not in the expected format")
	}

	t.Logf("Found insurance: provider=%v policy=%v", ins["ProviderName"], ins["PolicyNumber"])
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
