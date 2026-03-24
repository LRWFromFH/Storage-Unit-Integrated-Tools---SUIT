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
		api.POST("/logout", controllers.Logout) //Added logout route to clear the session and CSRF cookies on the client side
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
		protected.GET("/dashboard", func(c *gin.Context) {
			employeeID, _ := c.Get("employee_id")
			role, _ := c.Get("role")
			c.JSON(http.StatusOK, gin.H{
				"message":     "You have access",
				"employee_id": employeeID,
				"role":        role,
			})
		})

		protected.GET("/session", controllers.Session)

		protected.POST("/searchDB", controllers.SearchDB)

		//Customer crud routes.
		protected.GET("/customers", controllers.GetAllCustomers)
		protected.POST("/customers", controllers.CreateCustomer)
		protected.GET("/customers/:id", controllers.GetCustomer)
		protected.POST("/customers/:id", controllers.UpdateCustomer)
		protected.DELETE("/customers/:id", controllers.DeleteCustomer)
		protected.GET("/customers/:id/units", controllers.GetCustomerUnits)

		//Unit crud routes.
		protected.POST("/units/:id", controllers.UpdateUnit)
		protected.GET("/AvailableUnits", controllers.GetAvailableUnits)
		protected.GET("/units/:unit_number", controllers.GetUnit)
		protected.POST("/units", controllers.CreateUnit)
		protected.POST("/units/combine", controllers.CombineUnits)
		protected.DELETE("/units/:unit_number", controllers.DeleteUnit)

	}

	r.Static("/assets", "../frontend/dist/frontend/browser/")
	r.StaticFile("/", "../frontend/dist/frontend/browser/index.html")
	r.NoRoute(func(c *gin.Context) {
		c.File("../frontend/dist/frontend/browser/index.html")
	})
}
