package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {

	api := r.Group("/api")
	{
		api.POST("/register", controllers.Register)
		api.POST("/login", controllers.Login)
	}

	r.Static("/", "./static/browser")
	r.NoRoute(func(c *gin.Context) {
		c.File("./static/browser/index.html")
	})
}
