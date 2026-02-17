package middleware

import (
	"net/http"
	"strings"

	"backend/controllers"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			return
		}

		tokenString := parts[1]
		claims := &controllers.Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return controllers.JwtSecret(), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		c.Set("employee_id", claims.EmployeeID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func CSRF() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("XSRF-TOKEN")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}
		// Get token from cookie
		cookieToken, err := c.Cookie("CSRF-TOKEN")
		if cookieToken == "" || err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "CSRF token missing"})
			c.Abort()
			return
		}
		// Get token from header
		headerToken := c.GetHeader("XSRF-TOKEN")

		if headerToken == "" || cookieToken != headerToken {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "CSRF token mismatch"})
			return
		}
		c.Next()
	}
}
