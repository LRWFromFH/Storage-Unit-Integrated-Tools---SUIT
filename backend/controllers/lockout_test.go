package controllers_test

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"net/http"
	"testing"
)

func TestGetDeactivatedUnits(t *testing.T) {
	r := setupTestRouter()

	customer := models.Customer{FirstName: "Grace", LastName: "Lee", Phone: "904-400-5000", Address: "7 Bay Ave", Email: "grace@test.com"}
	database.DB.Create(&customer)

	database.DB.Create(&models.Unit{UnitNumber: "D1001", SizeType: "5x5", Price: 74.95, Length: 5, Width: 5, Height: 10, Combined: false, CustomerID: &customer.ID, Status: models.UnitStatusDeactivated})
	database.DB.Create(&models.Unit{UnitNumber: "D1002", SizeType: "5x5", Price: 74.95, Length: 5, Width: 5, Height: 10, Combined: false, Status: models.UnitStatusNormal})

	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})
	w := makeRequest(t, r, "GET", "/api/DeactivatedUnits", nil, login)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	units := resp["units"].([]interface{})

	if len(units) != 1 {
		t.Fatalf("expected 1 deactivated unit, got %d", len(units))
	}

	unit := units[0].(map[string]interface{})
	if unit["Status"] != models.UnitStatusDeactivated {
		t.Errorf("expected status Deactivated, got %v", unit["Status"])
	}
	if unit["Renter"] == nil {
		t.Error("expected renter to be preloaded")
	}
	t.Logf("Deactivated units: %d, unit number: %v", len(units), unit["UnitNumber"])
}

func TestGetDeactivatedUnits_NormalNotIncluded(t *testing.T) {
	r := setupTestRouter()

	database.DB.Create(&models.Unit{UnitNumber: "D2001", SizeType: "5x5", Price: 74.95, Length: 5, Width: 5, Height: 10, Combined: false, Status: models.UnitStatusNormal})

	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})
	w := makeRequest(t, r, "GET", "/api/DeactivatedUnits", nil, login)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	units := resp["units"].([]interface{})

	for _, item := range units {
		u := item.(map[string]interface{})
		if u["UnitNumber"] == "D2001" {
			t.Error("Normal unit D2001 should not appear in deactivated list")
		}
	}
	t.Logf("Normal unit correctly excluded from deactivated list (%d deactivated total)", len(units))
}
