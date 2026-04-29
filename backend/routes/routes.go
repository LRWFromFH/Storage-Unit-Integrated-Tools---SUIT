package routes

import (
	"net/http"

	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {

	// सार्वजनिक (no auth)
	api := r.Group("/api")
	{
		api.POST("/login", controllers.Login)
		api.POST("/logout", controllers.Logout)
		api.GET("/session", controllers.Session)
	}

	// Manager-only routes
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
	}

	// Protected routes (authenticated users)
	protected := r.Group("/api")
	protected.Use(middleware.AuthRequired())
	protected.Use(middleware.CSRFRequired())
	{
		// Debug endpoints
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
				"message":     "Dashboard access",
				"employee_id": employeeID,
				"role":        role,
			})
		})

		// Search
		protected.POST("/searchDB", controllers.SearchDB)

		// -------------------- Customers --------------------
		protected.GET("/customers", controllers.GetAllCustomers)
		protected.POST("/customers", controllers.CreateCustomer)
		protected.GET("/customers/:id", controllers.GetCustomer)
		protected.POST("/customers/:id", controllers.UpdateCustomer)

		protected.GET("/customers/:id/units", controllers.GetCustomerUnits)

		// Notes (FIXED: only one set)
		protected.GET("/customers/:id/notes", controllers.GetNotes)
		protected.POST("/customers/:id/notes", controllers.CreateNote)
		protected.DELETE("/customers/:id/notes/:nid", controllers.DeleteNote)

		// Balance + Transactions
		protected.GET("/customers/:id/balance", controllers.GetCustomerBalance)
		protected.GET("/customers/:id/transactions", controllers.GetTransactions)

		protected.POST("/PostCharge", controllers.PostCharge)
		protected.POST("/PostPayment", controllers.PostCustomerPayment)

		// -------------------- Units --------------------
		protected.POST("/units/:unit_number", controllers.UpdateUnit)
		protected.GET("/AllUnits", controllers.GetAllUnits)
		protected.GET("/AvailableUnits", controllers.GetAvailableUnits)
		protected.GET("/DeactivatedUnits", controllers.GetDeactivatedUnits)
		protected.GET("/units/:unit_number", controllers.GetUnit)
		protected.POST("/units", controllers.CreateUnit)
		protected.POST("/units/combine", controllers.CombineUnits)
		protected.POST("/units/:unit_number/assign", controllers.AssignCustomerToUnit)
		protected.POST("/units/:unit_number/moveout", controllers.MoveOut)

		// -------------------- Insurance (FIXED: no duplicates) --------------------
		protected.GET("/units/:unit_number/insurance", controllers.GetInsurance)
		protected.POST("/units/:unit_number/insurance", controllers.UpsertInsurance)

		// -------------------- Reservations --------------------
		protected.POST("/reservations", controllers.CreateReservation)
		protected.DELETE("/reservations/:id", controllers.CancelReservation)
		protected.GET("/reservations", controllers.GetReservations)

		// -------------------- Forms --------------------
		protected.GET("/forms/util", controllers.HandleUtilPDF)
		protected.GET("/forms/lockouts", controllers.GetLockoutReport)

	}

	// Static frontend
	r.Static("/assets", "../frontend/dist/frontend/browser/")
	r.StaticFile("/", "../frontend/dist/frontend/browser/index.html")

	r.NoRoute(func(c *gin.Context) {
		c.File("../frontend/dist/frontend/browser/index.html")
	})
}
