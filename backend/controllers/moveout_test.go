package controllers_test

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"
)

func TestMoveOut(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{FirstName: "Eve", LastName: "Stone", Phone: "904-100-2000", Address: "5 River Rd", Email: "eve@test.com"}
	database.DB.Create(&customer)

	dueDate := time.Now().AddDate(0, 0, 30)
	unit := models.Unit{UnitNumber: "M1001", SizeType: "5x5", Price: 74.95, Length: 5, Width: 5, Height: 10, Combined: false, CustomerID: &customer.ID, NextDueDate: &dueDate, Status: models.UnitStatusNormal}
	database.DB.Create(&unit)

	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})
	w := makeRequest(t, r, "POST", fmt.Sprintf("/api/units/%s/moveout", unit.UnitNumber), nil, login)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var updated models.Unit
	database.DB.First(&updated, unit.ID)

	if updated.CustomerID != nil {
		t.Error("CustomerID should be nil after move-out")
	}
	if updated.NextDueDate != nil {
		t.Error("NextDueDate should be nil after move-out")
	}
	if updated.Status != models.UnitStatusNormal {
		t.Errorf("Status should be Normal after move-out, got %s", updated.Status)
	}
	t.Logf("Move-out complete: CustomerID=%v NextDueDate=%v Status=%s", updated.CustomerID, updated.NextDueDate, updated.Status)
}

func TestMoveOut_NoRenter(t *testing.T) {
	r := setupTestRouter()

	unit := models.Unit{UnitNumber: "M2001", SizeType: "5x5", Price: 74.95, Length: 5, Width: 5, Height: 10, Combined: false, Status: models.UnitStatusNormal}
	database.DB.Create(&unit)

	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})
	w := makeRequest(t, r, "POST", fmt.Sprintf("/api/units/%s/moveout", unit.UnitNumber), nil, login)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestMoveOut_UnitNotFound(t *testing.T) {
	r := setupTestRouter()
	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})
	w := makeRequest(t, r, "POST", "/api/units/DOESNOTEXIST/moveout", nil, login)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestMoveOut_CancelsActiveReservation(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{FirstName: "Frank", LastName: "Hill", Phone: "904-200-3000", Address: "6 Lake Dr", Email: "frank@test.com"}
	database.DB.Create(&customer)

	dueDate := time.Now().AddDate(0, 0, 30)
	unit := models.Unit{UnitNumber: "M3001", SizeType: "10x10", Price: 149.95, Length: 10, Width: 10, Height: 10, Combined: false, CustomerID: &customer.ID, NextDueDate: &dueDate, Status: models.UnitStatusNormal}
	database.DB.Create(&unit)

	res := models.Reservation{CustomerID: customer.ID, SizeType: "10x10", CardLastFour: "5555", Status: models.ReservationStatusActive}
	database.DB.Create(&res)

	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})
	makeRequest(t, r, "POST", fmt.Sprintf("/api/units/%s/moveout", unit.UnitNumber), nil, login)

	var updated models.Reservation
	database.DB.First(&updated, res.ID)
	if updated.Status != models.ReservationStatusCancelled {
		t.Errorf("expected reservation cancelled, got %s", updated.Status)
	}

	w := makeRequest(t, r, "GET", "/api/reservations", nil, login)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	for _, item := range resp["reservations"].([]interface{}) {
		r := item.(map[string]interface{})
		if uint(r["ID"].(float64)) == res.ID {
			t.Error("cancelled reservation still in active list after move-out")
		}
	}
	t.Logf("Reservation %d cancelled on move-out", res.ID)
}
