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
)

func makeRequest(t *testing.T, r interface{ ServeHTTP(http.ResponseWriter, *http.Request) }, method, path string, body interface{}, login *httptest.ResponseRecorder) *httptest.ResponseRecorder {
	var jsonBody []byte
	if body != nil {
		jsonBody, _ = json.Marshal(body)
	}
	req, _ := http.NewRequest(method, path, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	if login != nil {
		req.Header.Set("X-CSRF-TOKEN", getCSRFToken(login))
		attachCookies(req, login)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestCreateReservation(t *testing.T) {
	r := setupTestRouter(t)

	customer := models.Customer{FirstName: "Alice", LastName: "Brown", Phone: "904-111-2222", Address: "1 Main St", Email: "alice@test.com"}
	database.DB.Create(&customer)

	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})

	w := makeRequest(t, r, "POST", "/api/reservations", map[string]interface{}{
		"customer_id":    customer.ID,
		"size_type":      "5x5",
		"card_last_four": "4242",
	}, login)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	res := resp["reservation"].(map[string]interface{})

	if res["Status"] != models.ReservationStatusActive {
		t.Errorf("expected status active, got %v", res["Status"])
	}
	if res["SizeType"] != "5x5" {
		t.Errorf("expected size_type 5x5, got %v", res["SizeType"])
	}
	t.Logf("Reservation created: ID=%v status=%v", res["ID"], res["Status"])
}

func TestCreateReservation_MissingField(t *testing.T) {
	r := setupTestRouter(t)
	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})

	w := makeRequest(t, r, "POST", "/api/reservations", map[string]interface{}{
		"customer_id": 1,
		"size_type":   "5x5",
	}, login)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCreateReservation_BadCustomer(t *testing.T) {
	r := setupTestRouter(t)
	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})

	w := makeRequest(t, r, "POST", "/api/reservations", map[string]interface{}{
		"customer_id":    99999,
		"size_type":      "5x5",
		"card_last_four": "1234",
	}, login)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestGetReservations(t *testing.T) {
	r := setupTestRouter(t)

	customer := models.Customer{FirstName: "Bob", LastName: "Green", Phone: "904-333-4444", Address: "2 Oak St", Email: "bob@test.com"}
	database.DB.Create(&customer)
	database.DB.Create(&models.Reservation{CustomerID: customer.ID, SizeType: "10x10", CardLastFour: "1111", Status: models.ReservationStatusActive})

	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})
	w := makeRequest(t, r, "GET", "/api/reservations", nil, login)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	reservations := resp["reservations"].([]interface{})

	if len(reservations) == 0 {
		t.Fatal("expected at least one active reservation")
	}
	t.Logf("Active reservations: %d", len(reservations))
}

func TestCancelReservation(t *testing.T) {
	r := setupTestRouter(t)

	customer := models.Customer{FirstName: "Carol", LastName: "White", Phone: "904-555-6666", Address: "3 Pine St", Email: "carol@test.com"}
	database.DB.Create(&customer)
	res := models.Reservation{CustomerID: customer.ID, SizeType: "5x10", CardLastFour: "9999", Status: models.ReservationStatusActive}
	database.DB.Create(&res)

	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})

	w := makeRequest(t, r, "DELETE", fmt.Sprintf("/api/reservations/%d", res.ID), nil, login)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// verify it no longer appears in active list
	w2 := makeRequest(t, r, "GET", "/api/reservations", nil, login)
	var resp map[string]interface{}
	json.Unmarshal(w2.Body.Bytes(), &resp)
	for _, item := range resp["reservations"].([]interface{}) {
		r := item.(map[string]interface{})
		if uint(r["ID"].(float64)) == res.ID {
			t.Error("cancelled reservation still appears in active list")
		}
	}
	t.Logf("Reservation %d cancelled and removed from active list", res.ID)
}

func TestCancelReservation_NotFound(t *testing.T) {
	r := setupTestRouter(t)
	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})

	w := makeRequest(t, r, "DELETE", "/api/reservations/99999", nil, login)
	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestAssignAutoFulfillsReservation(t *testing.T) {
	r := setupTestRouter(t)

	customer := models.Customer{FirstName: "Dan", LastName: "Black", Phone: "904-777-8888", Address: "4 Elm St", Email: "dan@test.com"}
	database.DB.Create(&customer)

	unit := models.Unit{UnitNumber: "T1001", SizeType: "5x5", Price: 74.95, Length: 5, Width: 5, Height: 10, Combined: false, Status: models.UnitStatusNormal}
	database.DB.Create(&unit)

	res := models.Reservation{CustomerID: customer.ID, SizeType: "5x5", CardLastFour: "4242", Status: models.ReservationStatusActive}
	database.DB.Create(&res)

	login := loginUser(r, map[string]string{"email": "manager@suit.com", "password": "Manager123!"})

	w := makeRequest(t, r, "POST", fmt.Sprintf("/api/units/%s/assign", unit.UnitNumber), map[string]interface{}{
		"customer_id": customer.ID,
	}, login)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var updated models.Reservation
	database.DB.First(&updated, res.ID)
	if updated.Status != models.ReservationStatusFulfilled {
		t.Errorf("expected reservation status fulfilled, got %s", updated.Status)
	}
	t.Logf("Reservation %d auto-fulfilled on assign", res.ID)
}
