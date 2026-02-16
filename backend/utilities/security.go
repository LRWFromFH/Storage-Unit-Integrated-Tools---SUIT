package utilities

import (
	"backend/database"
	"backend/models"
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

// CheckPasswordHash compares a plaintext password with a bcrypt hash and returns true if they match
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func GenerateToken() string {
	var csrfToken string
	var err error
	var timeNow = time.Now().String()

	csrfToken, err = HashPassword(timeNow)
	if err != nil {
		log.Fatal("Error generating token: ", err)
	}

	return csrfToken
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
	cookie.expiration = time.Now().Add(24 * time.Hour) // Cookie expires in 24 hours
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
