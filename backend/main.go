package main

import (
	"study-quiz/database"
	"study-quiz/handlers"
	"study-quiz/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Init()

	r := gin.Default()
	r.MaxMultipartMemory = 100 << 20

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)

	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		auth.GET("/me", handlers.GetMe)

		auth.GET("/categories", handlers.GetCategories)
		auth.POST("/categories", handlers.CreateCategory)
		auth.POST("/categories/join", handlers.JoinCategory)
		auth.GET("/categories/:id", handlers.GetCategory)
		auth.DELETE("/categories/:id", handlers.DeleteCategory)
		auth.POST("/categories/:id/leave", handlers.LeaveCategory)
		auth.GET("/categories/:id/ranking", handlers.GetRanking)
		auth.GET("/categories/:id/members", handlers.GetMembers)
		auth.DELETE("/categories/:id/members/:uid", handlers.RemoveMember)

		auth.POST("/categories/:id/import", handlers.ImportQuestions)
		auth.GET("/categories/:id/questions", handlers.GetQuestions)
		auth.DELETE("/questions/:id", handlers.DeleteQuestion)

		auth.GET("/categories/:id/practice/status", handlers.CheckPracticeStatus)
		auth.POST("/categories/:id/practice/start", handlers.StartPractice)
		auth.PUT("/categories/:id/practice/progress", handlers.UpdatePracticeProgress)
		auth.DELETE("/categories/:id/practice/progress", handlers.DeletePracticeProgress)
		auth.POST("/categories/:id/practice/complete", handlers.CompletePractice)
		auth.POST("/questions/:id/answer", handlers.SubmitAnswer)

		auth.POST("/categories/:id/exam/start", handlers.StartExam)
		auth.POST("/categories/:id/exam/submit", handlers.SubmitExam)

		auth.GET("/categories/:id/wrong-questions", handlers.GetWrongQuestions)
		auth.POST("/questions/:id/remove-wrong", handlers.RemoveWrongQuestion)
		auth.DELETE("/categories/:id/wrong-records", handlers.ClearWrongRecords)
	}

	r.Run(":40008")
}
