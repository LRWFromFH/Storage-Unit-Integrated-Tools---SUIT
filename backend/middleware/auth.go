package middleware

import (
	"net/http"

	"backend/controllers"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

//Added CSRF protection and switched to cookie-based JWT storage, the csrf token is generated on login and stored in a cookie.
func CSRFRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
			c.Next()  // safe methods don't need CSRF
			return
		}
		cookieToken, err := c.Cookie("csrf_token")
		headerToken := c.GetHeader("X-CSRF-Token")

		if err != nil || cookieToken == "" || headerToken != cookieToken {
			c.AbortWithStatusJSON(403, gin.H{"error": "CSRF validation failed"})
			return
		}
		c.Next()
	}
}

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {

		tokenString, err := c.Cookie("session_token")
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Session cookie required"})
			return
		}
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
