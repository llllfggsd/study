package handlers

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"study-quiz/database"
	"study-quiz/models"
	"time"

	"github.com/gin-gonic/gin"
)

func CheckPracticeStatus(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")
	mode := c.DefaultQuery("mode", "order")

	var progress models.PracticeProgress
	err := database.DB.Where("user_id = ? AND category_id = ? AND mode = ?", userID, categoryID, mode).First(&progress).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"has_progress": false})
		return
	}

	var ids []uint
	json.Unmarshal([]byte(progress.QuestionIDs), &ids)
	total := len(ids)

	if progress.CurrentIndex >= total {
		database.DB.Delete(&progress)
		c.JSON(http.StatusOK, gin.H{"has_progress": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_progress":  true,
		"current_index": progress.CurrentIndex,
		"total":         total,
	})
}

func StartPractice(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	var req struct {
		Mode  string `json:"mode" binding:"required"`
		IsNew bool   `json:"is_new"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	_, ownerID, _, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	catID, _ := strconv.ParseUint(categoryID, 10, 32)

	if !req.IsNew {
		var progress models.PracticeProgress
		if err := database.DB.Where("user_id = ? AND category_id = ? AND mode = ?", userID, categoryID, req.Mode).First(&progress).Error; err == nil {
			var ids []uint
			json.Unmarshal([]byte(progress.QuestionIDs), &ids)

			if len(ids) > 0 {
				var questions []models.Question
				database.DB.Where("id IN ?", ids).Find(&questions)

				qmap := make(map[uint]models.Question)
				for _, q := range questions {
					qmap[q.ID] = q
				}
				ordered := make([]models.Question, 0, len(ids))
				for _, id := range ids {
					if q, ok := qmap[id]; ok {
						ordered = append(ordered, q)
					}
				}

				c.JSON(http.StatusOK, gin.H{
					"questions":     ordered,
					"current_index": progress.CurrentIndex,
				})
				return
			}
		}
	}

	var questions []models.Question
	query := database.DB.Where("category_id = ? AND user_id = ?", categoryID, ownerID)
	if req.Mode == "random" {
		query = query.Order("RANDOM()")
	} else {
		query = query.Order("id ASC")
	}
	query.Find(&questions)

	ids := make([]uint, len(questions))
	for i, q := range questions {
		ids[i] = q.ID
	}
	idsJSON, _ := json.Marshal(ids)

	database.DB.Where("user_id = ? AND category_id = ? AND mode = ?", userID, categoryID, req.Mode).Delete(&models.PracticeProgress{})
	database.DB.Create(&models.PracticeProgress{
		UserID:       userID,
		CategoryID:   uint(catID),
		Mode:         req.Mode,
		CurrentIndex: 0,
		QuestionIDs:  string(idsJSON),
	})

	c.JSON(http.StatusOK, gin.H{
		"questions":     questions,
		"current_index": 0,
	})
}

func UpdatePracticeProgress(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	var req struct {
		Mode         string `json:"mode" binding:"required"`
		CurrentIndex int    `json:"current_index"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	database.DB.Model(&models.PracticeProgress{}).
		Where("user_id = ? AND category_id = ? AND mode = ?", userID, categoryID, req.Mode).
		Updates(map[string]interface{}{
			"current_index": req.CurrentIndex,
			"updated_at":    time.Now(),
		})

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func DeletePracticeProgress(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")
	mode := c.DefaultQuery("mode", "order")

	database.DB.Where("user_id = ? AND category_id = ? AND mode = ?", userID, categoryID, mode).
		Delete(&models.PracticeProgress{})

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func SubmitAnswer(c *gin.Context) {
	userID := c.GetUint("user_id")
	questionID := c.Param("id")

	question, err := getQuestionWithAccess(userID, questionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	var req struct {
		Answer string `json:"answer" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提交答案"})
		return
	}

	userAnswer := NormalizeAnswer(req.Answer)
	correctAnswer := NormalizeAnswer(question.Answer)

	isCorrect := 0
	if userAnswer != "" && userAnswer == correctAnswer {
		isCorrect = 1
	}

	record := models.QuestionRecord{
		UserID:     userID,
		QuestionID: question.ID,
		UserAnswer: userAnswer,
		IsCorrect:  isCorrect,
		AnsweredAt: time.Now(),
	}
	database.DB.Create(&record)

	c.JSON(http.StatusOK, gin.H{
		"is_correct":     isCorrect == 1,
		"user_answer":    userAnswer,
		"correct_answer": correctAnswer,
		"explanation":    question.Explanation,
	})
}

func getQuestionCategoryID(questionID string) string {
	var q models.Question
	database.DB.First(&q, questionID)
	return fmt.Sprintf("%d", q.CategoryID)
}

func CompletePractice(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	var req struct {
		Mode         string `json:"mode" binding:"required"`
		CorrectCount int    `json:"correct_count"`
		TotalCount   int    `json:"total_count"`
		Duration     int    `json:"duration"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	_, _, _, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	catID, _ := strconv.ParseUint(categoryID, 10, 32)

	score := 0.0
	if req.TotalCount > 0 {
		score = math.Round(float64(req.CorrectCount)/float64(req.TotalCount)*1000) / 10
	}

	database.DB.Create(&models.PracticeResult{
		UserID:       userID,
		CategoryID:   uint(catID),
		Mode:         req.Mode,
		TotalCount:   req.TotalCount,
		CorrectCount: req.CorrectCount,
		Score:        score,
		Duration:     req.Duration,
		CompletedAt:  time.Now(),
	})

	database.DB.Where("user_id = ? AND category_id = ? AND mode = ?", userID, categoryID, req.Mode).
		Delete(&models.PracticeProgress{})

	c.JSON(http.StatusOK, gin.H{
		"score":         score,
		"correct_count": req.CorrectCount,
		"total_count":   req.TotalCount,
		"duration":      req.Duration,
	})
}
