package routes

import (
	"net/http"

	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {

	api := r.Group("/api")
	{
		api.POST("/register", controllers.Register)
		api.POST("/login", controllers.Login)
	}

	protected := r.Group("/")
	protected.Use(middleware.AuthRequired(), middleware.CSRF())
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
		protected.GET("/dashboard", func(c *gin.Context) {
			employeeID, _ := c.Get("employee_id")
			role, _ := c.Get("role")
			c.JSON(http.StatusOK, gin.H{
				"message":     "You have access",
				"employee_id": employeeID,
				"role":        role,
			})
		})
	}

	r.Static("/assets", "../frontend/dist/frontend/browser/")
	r.StaticFile("/", "../frontend/dist/frontend/browser/index.html")
	r.NoRoute(func(c *gin.Context) {
		c.File("../frontend/dist/frontend/browser/index.html")
	})
}
