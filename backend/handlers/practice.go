package handlers

import (
	"net/http"
	"study-quiz/database"
	"study-quiz/models"
	"time"

	"github.com/gin-gonic/gin"
)

func GetPractice(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")
	mode := c.DefaultQuery("mode", "order")

	var questions []models.Question
	query := database.DB.Where("category_id = ? AND user_id = ?", categoryID, userID)

	if mode == "random" {
		query = query.Order("RANDOM()")
	} else {
		query = query.Order("id ASC")
	}

	query.Find(&questions)
	c.JSON(http.StatusOK, questions)
}

func SubmitAnswer(c *gin.Context) {
	userID := c.GetUint("user_id")
	questionID := c.Param("id")

	var req struct {
		Answer string `json:"answer" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提交答案"})
		return
	}

	var question models.Question
	if err := database.DB.Where("id = ? AND user_id = ?", questionID, userID).First(&question).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	isCorrect := 0
	if req.Answer == question.Answer {
		isCorrect = 1
	}

	record := models.QuestionRecord{
		UserID:     userID,
		QuestionID: question.ID,
		UserAnswer: req.Answer,
		IsCorrect:  isCorrect,
		AnsweredAt: time.Now(),
	}
	database.DB.Create(&record)

	c.JSON(http.StatusOK, gin.H{
		"is_correct":     isCorrect == 1,
		"user_answer":    req.Answer,
		"correct_answer": question.Answer,
		"explanation":    question.Explanation,
	})
}
