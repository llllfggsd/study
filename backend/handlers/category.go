package handlers

import (
	"net/http"
	"study-quiz/database"
	"study-quiz/models"

	"github.com/gin-gonic/gin"
)

func GetCategories(c *gin.Context) {
	userID := c.GetUint("user_id")
	var categories []models.Category
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&categories)

	for i := range categories {
		database.DB.Model(&models.Question{}).
			Where("category_id = ? AND user_id = ?", categories[i].ID, userID).
			Count(&categories[i].QuestionCount)

		database.DB.Model(&models.QuestionRecord{}).
			Joins("JOIN questions ON questions.id = question_records.question_id").
			Where("question_records.user_id = ? AND questions.category_id = ? AND question_records.is_correct = 0", userID, categories[i].ID).
			Distinct("question_records.question_id").
			Count(&categories[i].WrongCount)

		database.DB.Model(&models.QuestionRecord{}).
			Joins("JOIN questions ON questions.id = question_records.question_id").
			Where("question_records.user_id = ? AND questions.category_id = ?", userID, categories[i].ID).
			Distinct("question_records.question_id").
			Count(&categories[i].PracticedCount)
	}

	c.JSON(http.StatusOK, categories)
}

func CreateCategory(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请输入分类名称"})
		return
	}

	category := models.Category{
		UserID: userID,
		Name:   req.Name,
	}
	if err := database.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, category)
}

func DeleteCategory(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	var category models.Category
	if err := database.DB.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	database.DB.Where("category_id = ? AND user_id = ?", categoryID, userID).Delete(&models.Question{})
	database.DB.Delete(&category)

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

func GetCategory(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	var category models.Category
	if err := database.DB.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	database.DB.Model(&models.Question{}).
		Where("category_id = ? AND user_id = ?", category.ID, userID).
		Count(&category.QuestionCount)

	database.DB.Model(&models.QuestionRecord{}).
		Joins("JOIN questions ON questions.id = question_records.question_id").
		Where("question_records.user_id = ? AND questions.category_id = ? AND question_records.is_correct = 0", userID, category.ID).
		Distinct("question_records.question_id").
		Count(&category.WrongCount)

	database.DB.Model(&models.QuestionRecord{}).
		Joins("JOIN questions ON questions.id = question_records.question_id").
		Where("question_records.user_id = ? AND questions.category_id = ?", userID, category.ID).
		Distinct("question_records.question_id").
		Count(&category.PracticedCount)

	c.JSON(http.StatusOK, category)
}
