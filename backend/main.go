package main

import (
	"backend/database"
	"backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	r := gin.Default()
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:4200", "http://127.0.0.1:8080"}
	config.AllowCredentials = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-CSRF-Token"}
	r.Use(cors.New(config))

	small, medium, large, xlarge := 50, 35, 25, 15
	database.DevInit(small, medium, large, xlarge)
	routes.SetupRoutes(r)

	r.Run(":8080") // http://localhost:8080 or 127.0.0.1:8080 or your-lan-IP:8080
}
