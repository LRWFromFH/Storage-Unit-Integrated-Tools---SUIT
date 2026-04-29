package controllers_test

import (
	"backend/controllers"
	"backend/database"
	"backend/middleware"
	"backend/models"
	"backend/utilities"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func setupRBACRouter(t *testing.T) *gin.Engine {
	gin.SetMode(gin.TestMode)
	utilities.BcryptCost = bcrypt.MinCost
	database.ConnectTest(t.Name())

	r := gin.New()

	api := r.Group("/api")
	{
		api.POST("/login", controllers.Login)
	}

	managerOnly := r.Group("/api")
	managerOnly.Use(middleware.AuthRequired())
	managerOnly.Use(middleware.CSRFRequired())
	managerOnly.Use(middleware.RoleRequired(middleware.RoleManager))
	{
		managerOnly.POST("/register", controllers.Register)
		managerOnly.POST("/employees/:id/role", controllers.UpdateEmployeeRole)
	}

	return r
}

// inserts an employee directly into the DB, bypassing the register endpoint
func seedEmployee(role string, smid string, email string, password string) {
	hashed, _ := utilities.HashPassword(password)
	database.DB.Create(&models.Employee{
		SMID:     smid,
		Email:    email,
		Password: hashed,
		Role:     role,
	})
}

func loginAs(r *gin.Engine, email string, password string) *httptest.ResponseRecorder {
	return loginUser(r, map[string]string{
		"email":    email,
		"password": password,
	})
}

func TestRegister_BlocksEmployee(t *testing.T) {
	r := setupRBACRouter(t)
	seedEmployee("employee", "emp001", "emp@test.com", "securepassword123")

	loginResp := loginAs(r, "emp@test.com", "securepassword123")

	body, _ := json.Marshal(map[string]string{
		"username": "newuser",
		"email":    "newuser@test.com",
		"password": "securepassword123",
	})
	req, _ := http.NewRequest("POST", "/api/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CSRF-TOKEN", getCSRFToken(loginResp))
	attachCookies(req, loginResp)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

func TestRegister_AllowsManager(t *testing.T) {
	r := setupRBACRouter(t)
	seedEmployee("manager", "mgr001", "mgr@test.com", "securepassword123")

	loginResp := loginAs(r, "mgr@test.com", "securepassword123")

	body, _ := json.Marshal(map[string]string{
		"username": "newemployee",
		"email":    "newemployee@test.com",
		"password": "securepassword123",
	})
	req, _ := http.NewRequest("POST", "/api/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CSRF-TOKEN", getCSRFToken(loginResp))
	attachCookies(req, loginResp)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUpdateRole_BlocksEmployee(t *testing.T) {
	r := setupRBACRouter(t)
	seedEmployee("employee", "emp002", "emp2@test.com", "securepassword123")
	seedEmployee("employee", "emp003", "emp3@test.com", "securepassword123")

	loginResp := loginAs(r, "emp2@test.com", "securepassword123")

	var target models.Employee
	database.DB.Where("email = ?", "emp3@test.com").First(&target)

	body, _ := json.Marshal(map[string]string{"role": "manager"})
	req, _ := http.NewRequest("POST", "/api/employees/"+fmt.Sprintf("%d", target.ID)+"/role", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CSRF-TOKEN", getCSRFToken(loginResp))
	attachCookies(req, loginResp)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUpdateRole_AllowsManager(t *testing.T) {
	r := setupRBACRouter(t)
	seedEmployee("manager", "mgr002", "mgr2@test.com", "securepassword123")
	seedEmployee("employee", "emp004", "emp4@test.com", "securepassword123")

	loginResp := loginAs(r, "mgr2@test.com", "securepassword123")

	var target models.Employee
	database.DB.Where("email = ?", "emp4@test.com").First(&target)

	body, _ := json.Marshal(map[string]string{"role": "manager"})
	req, _ := http.NewRequest("POST", "/api/employees/"+fmt.Sprintf("%d", target.ID)+"/role", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CSRF-TOKEN", getCSRFToken(loginResp))
	attachCookies(req, loginResp)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var updated models.Employee
	database.DB.Where("email = ?", "emp4@test.com").First(&updated)
	if updated.Role != "manager" {
		t.Fatalf("expected role 'manager', got '%s'", updated.Role)
	}
}

func TestUpdateRole_InvalidRole(t *testing.T) {
	r := setupRBACRouter(t)
	seedEmployee("manager", "mgr003", "mgr3@test.com", "securepassword123")
	seedEmployee("employee", "emp005", "emp5@test.com", "securepassword123")

	loginResp := loginAs(r, "mgr3@test.com", "securepassword123")

	var target models.Employee
	database.DB.Where("email = ?", "emp5@test.com").First(&target)

	body, _ := json.Marshal(map[string]string{"role": "superadmin"})
	idStr := json.Number(fmt.Sprintf("%d", target.ID)).String()
	req, _ := http.NewRequest("POST", "/api/employees/"+idStr+"/role", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CSRF-TOKEN", getCSRFToken(loginResp))
	attachCookies(req, loginResp)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestUpdateRole_EmployeeNotFound(t *testing.T) {
	r := setupRBACRouter(t)
	seedEmployee("manager", "mgr004", "mgr4@test.com", "securepassword123")

	loginResp := loginAs(r, "mgr4@test.com", "securepassword123")

	body, _ := json.Marshal(map[string]string{"role": "employee"})
	req, _ := http.NewRequest("POST", "/api/employees/99999/role", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-CSRF-TOKEN", getCSRFToken(loginResp))
	attachCookies(req, loginResp)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", w.Code, w.Body.String())
	}
}
