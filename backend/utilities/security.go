package utilities

import (
	"backend/database"
	"backend/models"
	"crypto/rand"
	"encoding/hex"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type Cookie struct {
	value      string
	expiration time.Time
	createdAt  time.Time
}

// HashPassword takes a plaintext password and returns the bcrypt hash of it
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPasswordHash compares a plaintext password with a bcrypt hash and returns an error if they don't match
func CheckPasswordHash(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

// GenerateToken returns a cryptographically random 32-byte hex-encoded token
func GenerateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func GenerateCookie() Cookie {
	var timeNow = time.Now().String()
	cookieValue, err := HashPassword(timeNow)
	if err != nil {
		log.Fatal("Error generating cookie: ", err)
	}
	var cookie Cookie
	cookie.value = cookieValue
	cookie.createdAt = time.Now()
	cookie.expiration = cookie.createdAt.Add(24 * time.Hour) // Cookie expires in 24 hours
	return cookie
}

func ValidateToken(input string) bool {
	var session models.Session
	database.DB.Where("token = ?", input).First(&session)
	if session.ID == 0 {
		return false
	}

	return input == session.Token
}
