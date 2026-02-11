package main

import (
	"backend/database"
	"backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	database.Connect()
	routes.SetupRoutes(r)

	r.Run(":8080") // http://localhost:8080 or 127.0.0.1:8080 or your-lan-IP:8080
}
