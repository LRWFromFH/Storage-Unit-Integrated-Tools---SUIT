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
		api.POST("/login", controllers.Login)
		api.POST("/logout", controllers.Logout) //Added logout route to clear the session and CSRF cookies on the client side
		api.GET("/session", controllers.Session)
	}

	managerOnly := r.Group("/api")
	managerOnly.Use(middleware.AuthRequired())
	managerOnly.Use(middleware.CSRFRequired())
	managerOnly.Use(middleware.RoleRequired(middleware.RoleManager))
	{
		managerOnly.POST("/register", controllers.Register)
		managerOnly.POST("/employees/:id/role", controllers.UpdateEmployeeRole)
		managerOnly.DELETE("/customers/:id", controllers.DeleteCustomer)
		managerOnly.DELETE("/units/:unit_number", controllers.DeleteUnit)
		managerOnly.GET("/employees", controllers.GetAllEmployees)
		managerOnly.GET("/AllUnits", controllers.GetAllUnits)
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

		protected.POST("/searchDB", controllers.SearchDB)

		//Customer crud routes.
		protected.GET("/customers", controllers.GetAllCustomers)
		protected.POST("/customers", controllers.CreateCustomer)
		protected.GET("/customers/:id", controllers.GetCustomer)
		protected.POST("/customers/:id", controllers.UpdateCustomer)

		protected.GET("/customers/:id/units", controllers.GetCustomerUnits)

		//Note routes.
		protected.GET("/customers/:id/notes", controllers.GetNotes)
		protected.POST("/customers/:id/notes", controllers.CreateNote)
		protected.DELETE("/customers/:id/notes/:nid", controllers.DeleteNote)

		//Unit crud routes.
		protected.POST("/units/:unit_number", controllers.UpdateUnit)
		protected.GET("/AvailableUnits", controllers.GetAvailableUnits)
		protected.GET("/units/:unit_number", controllers.GetUnit)
		protected.POST("/units", controllers.CreateUnit)
		protected.POST("/units/combine", controllers.CombineUnits)

		//Insurance routes.
		protected.GET("/units/:unit_number/insurance", controllers.GetInsurance)
		protected.POST("/units/:unit_number/insurance", controllers.UpsertInsurance)


		protected.GET("/customers/:id/balance", controllers.GetCustomerBalance)
		protected.GET("/customers/:id/transactions", controllers.GetTransactions)

	}

	r.Static("/assets", "../frontend/dist/frontend/browser/")
	r.StaticFile("/", "../frontend/dist/frontend/browser/index.html")
	r.NoRoute(func(c *gin.Context) {
		c.File("../frontend/dist/frontend/browser/index.html")
	})
}
