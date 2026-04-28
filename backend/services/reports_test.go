package services_test

import (
	"backend/controllers"
	"backend/database"
	"backend/middleware"
	"backend/models"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	database.ConnectTest()

	hashed, _ := bcrypt.GenerateFromPassword([]byte("Manager123!"), 14)
	database.DB.Create(&models.Employee{
		SMID:     "manager001",
		Email:    "manager@suit.com",
		Password: string(hashed),
		Role:     "manager",
	})

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

		protected.GET("/forms/util", controllers.HandleUtilPDF)
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

func TimePtr(t time.Time) *time.Time {
	return &t
}

func TestUtilPDFDownload(t *testing.T) {
	// 1. Setup Router and Mock Data
	r := setupTestRouter() // Your Gin engine
	database.DevInit(25, 25, 25, 25, true)
	api := "forms/util"
	req_type := "GET"

	// Seed a unit to ensure the PDF generation logic has data to process
	database.DB.Create(&models.Unit{
		UnitNumber:  "A-101",
		Price:       100.0,
		NextDueDate: TimePtr(time.Now()),
	})

	// Authentication Flow (Manual Boilerplate Logic)
	registerUser(r, map[string]string{
		"username": "pdf_test_user",
		"email":    "pdf_test@test.com",
		"password": "securepassword123",
	})

	loginResp := loginUser(r, map[string]string{
		"email":    "pdf_test@test.com",
		"password": "securepassword123",
	})

	// 3. Construct Request
	req, _ := http.NewRequest(req_type, "/api/"+api, nil)
	req.Header.Set("Content-Type", "application/json")

	// Security Headers
	csrfToken := getCSRFToken(loginResp)
	if csrfToken == "" {
		t.Fatal("No csrf_token cookie in login response")
	}
	req.Header.Set("X-CSRF-TOKEN", csrfToken)
	attachCookies(req, loginResp)

	// 4. Execute
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// 5. Assertions on ResponseWriter (w)
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Verify PDF Headers
	contentType := w.Header().Get("Content-Type")
	if contentType != "application/pdf" {
		t.Errorf("Expected Content-Type application/pdf, got %s", contentType)
	}

	disposition := w.Header().Get("Content-Disposition")
	if !strings.Contains(disposition, "attachment") || !strings.Contains(disposition, ".pdf") {
		t.Errorf("Expected PDF attachment header, got %s", disposition)
	}

	// Verify PDF Content
	body := w.Body.Bytes()
	if len(body) < 10 {
		t.Fatal("PDF body is suspiciously small or empty")
	}

	// Check for PDF Magic Number (%PDF-)
	if !bytes.HasPrefix(body, []byte("%PDF")) {
		t.Error("Response body does not start with PDF signature")
	}

	t.Logf("Success: Received %d bytes of PDF data", len(body))
}
