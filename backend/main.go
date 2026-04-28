package main

import (
	"backend/database"
	"backend/routes"
	"backend/services"
	"fmt"
	"os"
	"path/filepath"
	"time"

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

	small, medium, large, xlarge := 50, 40, 35, 25
	database.DevInit(small, medium, large, xlarge)
	routes.SetupRoutes(r)

	go func() {
		// Wait for DB stability
		time.Sleep(5 * time.Second)

		// Define a helper to run both tasks
		runDailyTasks := func() {
			fmt.Println("Executing daily background tasks...")

			// 1. Process Billing
			services.CheckAndProcessStorageBilling()

			// 2. Generate and Save Inventory PDF
			rows, err := services.GenerateInventoryReport()
			if err != nil {
				fmt.Printf("Error generating report data: %v\n", err)
				return
			}

			pdfBytes, err := services.ExportInventoryPDF(rows)
			if err != nil {
				fmt.Printf("Error exporting PDF: %v\n", err)
				return
			}

			// Path Handling: Using ./forms/util relative to where you run 'go run'
			timestamp := time.Now().Format("2006-01-02")
			fileName := fmt.Sprintf("Daily Utility [%s].pdf", timestamp)
			dirPath := "./forms/util"

			if err := os.MkdirAll(dirPath, 0755); err != nil {
				fmt.Printf("Warning: Could not create directory: %v\n", err)
			} else {
				filePath := filepath.Join(dirPath, fileName)
				if err := os.WriteFile(filePath, pdfBytes, 0644); err != nil {
					fmt.Printf("Warning: Could not save local copy: %v\n", err)
				} else {
					fmt.Printf("Success: Local copy saved to: %s\n", filePath)
				}
			}
		}

		// Run ONCE immediately on startup
		runDailyTasks()

		// Start the 24-hour cycle
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			runDailyTasks()
		}
	}()

	r.Run(":8080") // http://localhost:8080 or 127.0.0.1:8080 or your-lan-IP:8080
}
