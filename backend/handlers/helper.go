package handlers

import (
	"fmt"
	"math/rand"
	"study-quiz/database"
	"study-quiz/models"
)

func CheckCategoryAccess(userID uint, categoryID string) (*models.Category, uint, bool, error) {
	var category models.Category
	if err := database.DB.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err == nil {
		return &category, userID, true, nil
	}
	var member models.CategoryMember
	if err := database.DB.Where("user_id = ? AND category_id = ?", userID, categoryID).First(&member).Error; err == nil {
		if err := database.DB.First(&category, categoryID).Error; err == nil {
			return &category, category.UserID, false, nil
		}
	}
	return nil, 0, false, fmt.Errorf("no access")
}

func LoadCategoryStats(category *models.Category, userID uint, ownerID uint) {
	database.DB.Model(&models.Question{}).
		Where("category_id = ? AND user_id = ?", category.ID, ownerID).
		Count(&category.QuestionCount)

	database.DB.Model(&models.QuestionRecord{}).
		Joins("JOIN questions ON questions.id = question_records.question_id").
		Where("question_records.user_id = ? AND questions.category_id = ? AND questions.user_id = ? AND question_records.is_correct = 0", userID, category.ID, ownerID).
		Distinct("question_records.question_id").
		Count(&category.WrongCount)

	database.DB.Model(&models.QuestionRecord{}).
		Joins("JOIN questions ON questions.id = question_records.question_id").
		Where("question_records.user_id = ? AND questions.category_id = ? AND questions.user_id = ?", userID, category.ID, ownerID).
		Distinct("question_records.question_id").
		Count(&category.PracticedCount)
}

func GenerateShareCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	code := make([]byte, 6)
	for i := range code {
		code[i] = chars[rand.Intn(len(chars))]
	}
	return string(code)
}
