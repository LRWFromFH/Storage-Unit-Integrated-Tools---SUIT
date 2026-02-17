package controllers

import (
	"net/http"
	"os"
	"time"

	"backend/database"
	"backend/models"
	"crypto/rand"
	"encoding/hex"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	EmployeeID uint   `json:"employee_id"`
	Role       string `json:"role"`
	jwt.RegisteredClaims
}

func generateCSRFToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "Error generating CSRF token", err
	}
	return hex.EncodeToString(bytes), nil
}


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

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 14)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	employee := models.Employee{
		SMID:     req.SMID,
		Email:    req.Email,
		Password: string(hashedPassword),
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

	if err := bcrypt.CompareHashAndPassword([]byte(employee.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		EmployeeID: employee.ID,
		Role:       employee.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	csrfToken, _ := generateCSRFToken()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(JwtSecret())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}


	c.SetCookie(
      "session_token",  // cookie name
      tokenString,      // the JWT value
      86400,            // maxAge in seconds (24h to match your JWT expiry)
      "/",              // path — available on all routes
      "",               // domain — empty means current domain
      false,            // secure — set to true in production (HTTPS only)
      true,             // httpOnly — JS cannot read this cookie
  	)
	c.SetCookie("csrf_token", csrfToken, 86400, "/", "", false, false)

  c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}
