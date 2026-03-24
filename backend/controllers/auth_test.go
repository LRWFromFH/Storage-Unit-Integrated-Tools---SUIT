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
		api.POST("/logout", controllers.Logout)
	}

	protected := r.Group("/api")
	protected.Use(middleware.AuthRequired())
	protected.Use(middleware.CSRFRequired())
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
		protected.POST("/protected-post", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "POST succeeded"})
		})

		protected.GET("/session", controllers.Session)

		protected.POST("/searchDB", controllers.SearchDB)
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

// Helper: extract a named cookie from a response
func getCookie(w *httptest.ResponseRecorder, name string) *http.Cookie {
	for _, c := range w.Result().Cookies() {
		if c.Name == name {
			return c
		}
	}
	return nil
}

// Helper: attach login cookies to a request
func attachCookies(req *http.Request, w *httptest.ResponseRecorder) {
	for _, c := range w.Result().Cookies() {
		req.AddCookie(c)
	}
}

// Helper: get CSRF token from login response
func getCSRFToken(w *httptest.ResponseRecorder) string {
	c := getCookie(w, "csrf_token")
	if c == nil {
		return ""
	}
	return c.Value
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

// Vuln 2: Login must return a JWT token in session_token cookie
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

	sessionCookie := getCookie(w, "session_token")
	if sessionCookie == nil || sessionCookie.Value == "" {
		t.Fatal("Response does not contain a session_token cookie")
	}

	// Verify token is parseable
	claims := &controllers.Claims{}
	token, err := jwt.ParseWithClaims(sessionCookie.Value, claims, func(token *jwt.Token) (interface{}, error) {
		return controllers.JwtSecret(), nil
	})
	if err != nil || !token.Valid {
		t.Fatal("session_token cookie is not a valid JWT")
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

// Vuln 3: Protected route must accept valid session cookie
func TestProtectedRoute_AcceptsValidToken(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "protected_test",
		"email":    "protected@test.com",
		"password": "securepassword123",
	})

	loginResp := loginUser(r, map[string]string{
		"email":    "protected@test.com",
		"password": "securepassword123",
	})

	req, _ := http.NewRequest("GET", "/api/protected", nil)
	attachCookies(req, loginResp)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", w.Code, w.Body.String())
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

// --- Session Cookie Tests ---

// Login must set session_token as HttpOnly cookie
func TestLogin_SetsSessionCookie(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "session_test",
		"email":    "session@test.com",
		"password": "securepassword123",
	})

	w := loginUser(r, map[string]string{
		"email":    "session@test.com",
		"password": "securepassword123",
	})

	cookie := getCookie(w, "session_token")
	if cookie == nil {
		t.Fatal("session_token cookie not set")
	}
	if !cookie.HttpOnly {
		t.Fatal("session_token cookie must be HttpOnly")
	}
	if cookie.MaxAge != 86400 {
		t.Fatalf("Expected MaxAge 86400, got %d", cookie.MaxAge)
	}
}

// Login must set csrf_token as a non-HttpOnly cookie (JS readable)
func TestLogin_SetsCSRFCookie(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "csrf_cookie_test",
		"email":    "csrfcookie@test.com",
		"password": "securepassword123",
	})

	w := loginUser(r, map[string]string{
		"email":    "csrfcookie@test.com",
		"password": "securepassword123",
	})

	cookie := getCookie(w, "csrf_token")
	if cookie == nil {
		t.Fatal("csrf_token cookie not set")
	}
	if cookie.HttpOnly {
		t.Fatal("csrf_token cookie must NOT be HttpOnly (JS needs to read it)")
	}
	if len(cookie.Value) < 32 {
		t.Fatalf("csrf_token seems too short (%d chars), expected at least 32", len(cookie.Value))
	}
}

// --- CSRF Middleware Tests ---

// POST to protected route without X-CSRF-Token header must return 403
func TestCSRF_BlocksPostWithoutToken(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "csrf_block_test",
		"email":    "csrfblock@test.com",
		"password": "securepassword123",
	})

	loginResp := loginUser(r, map[string]string{
		"email":    "csrfblock@test.com",
		"password": "securepassword123",
	})

	req, _ := http.NewRequest("POST", "/api/protected-post", nil)
	attachCookies(req, loginResp)
	// Deliberately NOT setting X-CSRF-Token header
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

// GET to protected route should work without CSRF header (safe method)
func TestCSRF_AllowsGetWithoutToken(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "csrf_get_test",
		"email":    "csrfget@test.com",
		"password": "securepassword123",
	})

	loginResp := loginUser(r, map[string]string{
		"email":    "csrfget@test.com",
		"password": "securepassword123",
	})

	req, _ := http.NewRequest("GET", "/api/protected", nil)
	attachCookies(req, loginResp)
	// No X-CSRF-Token header — should still work for GET
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

// POST with valid X-CSRF-Token header must succeed
func TestCSRF_AllowsPostWithValidToken(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "csrf_valid_test",
		"email":    "csrfvalid@test.com",
		"password": "securepassword123",
	})

	loginResp := loginUser(r, map[string]string{
		"email":    "csrfvalid@test.com",
		"password": "securepassword123",
	})

	csrfToken := getCSRFToken(loginResp)
	if csrfToken == "" {
		t.Fatal("No csrf_token cookie in login response")
	}

	req, _ := http.NewRequest("POST", "/api/protected-post", nil)
	attachCookies(req, loginResp)
	req.Header.Set("X-CSRF-TOKEN", csrfToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

// --- Logout Tests ---

// Logout must clear session and CSRF cookies
func TestLogout_ClearsCookies(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "logout_test",
		"email":    "logout@test.com",
		"password": "securepassword123",
	})

	loginResp := loginUser(r, map[string]string{
		"email":    "logout@test.com",
		"password": "securepassword123",
	})

	req, _ := http.NewRequest("POST", "/api/logout", nil)
	attachCookies(req, loginResp)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", w.Code, w.Body.String())
	}

	sessionCookie := getCookie(w, "session_token")
	csrfCookie := getCookie(w, "csrf_token")

	if sessionCookie == nil || sessionCookie.MaxAge != -1 {
		t.Fatal("session_token cookie not cleared (MaxAge should be -1)")
	}
	if csrfCookie == nil || csrfCookie.MaxAge != -1 {
		t.Fatal("csrf_token cookie not cleared (MaxAge should be -1)")
	}
}

// After logout, protected route must reject the request
func TestLogout_ProtectedRouteFailsAfterLogout(t *testing.T) {
	r := setupTestRouter()

	registerUser(r, map[string]string{
		"username": "logout_protect_test",
		"email":    "logoutprotect@test.com",
		"password": "securepassword123",
	})

	loginResp := loginUser(r, map[string]string{
		"email":    "logoutprotect@test.com",
		"password": "securepassword123",
	})

	// Logout
	logoutReq, _ := http.NewRequest("POST", "/api/logout", nil)
	attachCookies(logoutReq, loginResp)
	logoutW := httptest.NewRecorder()
	r.ServeHTTP(logoutW, logoutReq)

	// Try to access protected route using the expired cookies from logout response
	req, _ := http.NewRequest("GET", "/api/protected", nil)
	attachCookies(req, logoutW)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 after logout, got %d: %s", w.Code, w.Body.String())
	}
}

func TestSearchDB(t *testing.T) {
	r := setupTestRouter()
	// Create test data
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

	registerUser(r, map[string]string{
		"username": "logout_protect_test",
		"email":    "logoutprotect@test.com",
		"password": "securepassword123",
	})

	loginResp := loginUser(r, map[string]string{
		"email":    "logoutprotect@test.com",
		"password": "securepassword123",
	})

	data := gin.H{"query": "John Doe"}
	jsonData, _ := json.Marshal(data)

	req, _ := http.NewRequest("POST", "/api/searchDB", bytes.NewBuffer(jsonData))
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
