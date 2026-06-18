package handlers

import (
	"net/http"
	"study-quiz/database"
	"study-quiz/models"

	"github.com/gin-gonic/gin"
)

func GetWrongQuestions(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	_, ownerID, _, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	var questions []models.Question
	database.DB.Raw(`
		SELECT DISTINCT q.*
		FROM questions q
		JOIN question_records r ON q.id = r.question_id
		WHERE r.user_id = ? AND q.category_id = ? AND q.user_id = ? AND r.is_correct = 0
		AND q.id NOT IN (
			SELECT question_id FROM question_records
			WHERE user_id = ? AND is_correct = 1
			AND question_id IN (
				SELECT question_id FROM question_records
				WHERE user_id = ? AND is_correct = 0
			)
			GROUP BY question_id
			HAVING MAX(answered_at) > (
				SELECT MAX(answered_at) FROM question_records
				WHERE user_id = ? AND is_correct = 0 AND question_id = question_records.question_id
			)
		)
		ORDER BY q.id ASC
	`, userID, categoryID, ownerID, userID, userID, userID).Scan(&questions)

	c.JSON(http.StatusOK, questions)
}

func RemoveWrongQuestion(c *gin.Context) {
	userID := c.GetUint("user_id")
	questionID := c.Param("id")

	database.DB.Where("user_id = ? AND question_id = ? AND is_correct = 0", userID, questionID).
		Delete(&models.QuestionRecord{})

	c.JSON(http.StatusOK, gin.H{"message": "已移除"})
}

func ClearWrongRecords(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	_, ownerID, _, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	database.DB.Exec(`
		DELETE FROM question_records
		WHERE user_id = ? AND is_correct = 0
		AND question_id IN (
			SELECT id FROM questions WHERE category_id = ? AND user_id = ?
		)
	`, userID, categoryID, ownerID)

	c.JSON(http.StatusOK, gin.H{"message": "错题记录已清空"})
}
