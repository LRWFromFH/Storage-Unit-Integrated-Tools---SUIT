package controllers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/controllers"
	"backend/database"
	"backend/middleware"
	"backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	database.ConnectTest()

	r := gin.New()
	api := r.Group("/api")
	{
		api.POST("/register", controllers.Register)
		api.POST("/login", controllers.Login)
	}

	protected := r.Group("/api")
	protected.Use(middleware.AuthRequired())
	{
		protected.GET("/protected", func(c *gin.Context) {
			employeeID, _ := c.Get("employee_id")
			role, _ := c.Get("role")
			c.JSON(http.StatusOK, gin.H{
				"message":     "You have access",
				"employee_id": employeeID,
				"role":        role,
			})
		})
	}

	return r
}

func registerUser(r *gin.Engine, body map[string]string) *httptest.ResponseRecorder {
	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", "/api/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func loginUser(r *gin.Engine, body map[string]string) *httptest.ResponseRecorder {
	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", "/api/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

// Vuln 1: Password must be bcrypt hashed in DB
func TestRegister_PasswordIsHashed(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "hash_test",
		"email":    "hash@test.com",
		"password": "securepassword123",
	})

	var employee models.Employee
	database.DB.Where("email = ?", "hash@test.com").First(&employee)

	if employee.Password == "securepassword123" {
		t.Fatal("Password stored in plain text")
	}

	err := bcrypt.CompareHashAndPassword([]byte(employee.Password), []byte("securepassword123"))
	if err != nil {
		t.Fatal("Password is not a valid bcrypt hash")
	}
}

// Vuln 2: Login must return a JWT token
func TestLogin_ReturnsJWTToken(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "jwt_test",
		"email":    "jwt@test.com",
		"password": "securepassword123",
	})

	w := loginUser(r, map[string]string{
		"email":    "jwt@test.com",
		"password": "securepassword123",
	})

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var response map[string]string
	json.Unmarshal(w.Body.Bytes(), &response)

	tokenString, exists := response["token"]
	if !exists || tokenString == "" {
		t.Fatal("Response does not contain a token")
	}

	// Verify token is parseable
	claims := &controllers.Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return controllers.JwtSecret(), nil
	})
	if err != nil || !token.Valid {
		t.Fatal("Token is not a valid JWT")
	}
}

// Vuln 2: Wrong password must return 401
func TestLogin_WrongPassword_Returns401(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "wrong_pw",
		"email":    "wrongpw@test.com",
		"password": "securepassword123",
	})

	w := loginUser(r, map[string]string{
		"email":    "wrongpw@test.com",
		"password": "wrongpassword",
	})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401, got %d", w.Code)
	}
}

// Vuln 3: Protected route must reject requests without token
func TestProtectedRoute_RejectsWithoutToken(t *testing.T) {
	r := setupTestRouter()

	req, _ := http.NewRequest("GET", "/api/protected", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401, got %d", w.Code)
	}
}

// Vuln 3: Protected route must accept valid token
func TestProtectedRoute_AcceptsValidToken(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "protected_test",
		"email":    "protected@test.com",
		"password": "securepassword123",
	})

	w := loginUser(r, map[string]string{
		"email":    "protected@test.com",
		"password": "securepassword123",
	})

	var loginResp map[string]string
	json.Unmarshal(w.Body.Bytes(), &loginResp)
	token := loginResp["token"]

	req, _ := http.NewRequest("GET", "/api/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req)

	if w2.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", w2.Code, w2.Body.String())
	}
}

// Vuln 4: Validation must reject invalid input
func TestRegister_ValidationRejectsInvalidInput(t *testing.T) {
	r := setupTestRouter()

	tests := []struct {
		name string
		body map[string]string
	}{
		{
			name: "missing email",
			body: map[string]string{
				"username": "no_email",
				"password": "securepassword123",
			},
		},
		{
			name: "bad email format",
			body: map[string]string{
				"username": "bad_email",
				"email":    "not-an-email",
				"password": "securepassword123",
			},
		},
		{
			name: "short password",
			body: map[string]string{
				"username": "short_pw",
				"email":    "short@test.com",
				"password": "short",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := registerUser(r, tt.body)
			if w.Code != http.StatusBadRequest {
				t.Fatalf("Expected 400, got %d: %s", w.Code, w.Body.String())
			}
		})
	}
}

// Vuln 5: Password must not appear in JSON response
func TestRegister_PasswordNotInResponse(t *testing.T) {
	r := setupTestRouter()

	w := registerUser(r, map[string]string{
		"username": "no_pw_resp",
		"email":    "nopw@test.com",
		"password": "securepassword123",
	})

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201, got %d: %s", w.Code, w.Body.String())
	}

	body := w.Body.String()
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	if user, ok := response["user"].(map[string]interface{}); ok {
		if _, exists := user["password"]; exists {
			t.Fatalf("Password field found in response: %s", body)
		}
	}
}

// Vuln 6: Duplicate email must return error
func TestRegister_DuplicateEmail_ReturnsError(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "dup1",
		"email":    "dup@test.com",
		"password": "securepassword123",
	})

	w := registerUser(r, map[string]string{
		"username": "dup2",
		"email":    "dup@test.com",
		"password": "securepassword456",
	})

	if w.Code == http.StatusCreated {
		t.Fatal("Should not allow duplicate email registration")
	}
}

// Vuln 6: Nonexistent email must return 401
func TestLogin_NonexistentEmail_Returns401(t *testing.T) {
	r := setupTestRouter()

	w := loginUser(r, map[string]string{
		"email":    "nonexistent@test.com",
		"password": "securepassword123",
	})

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401, got %d", w.Code)
	}
}

// Vuln 7: Mass assignment must not allow setting role
func TestRegister_MassAssignment_RoleIgnored(t *testing.T) {
	r := setupTestRouter()

	// Even if someone sends a "role" field, it should be ignored
	body := map[string]string{
		"username": "admin_attempt",
		"email":    "admin@test.com",
		"password": "securepassword123",
		"role":     "admin",
	}

	w := registerUser(r, body)
	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var employee models.Employee
	database.DB.Where("email = ?", "admin@test.com").First(&employee)

	if employee.Role != "employee" {
		t.Fatalf("Expected role 'employee', got '%s' — mass assignment vulnerability", employee.Role)
	}
}
