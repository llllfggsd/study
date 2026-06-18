package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"study-quiz/database"
	"study-quiz/models"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

func ImportQuestions(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	var category models.Category
	if err := database.DB.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "只有创建者可以导入题目"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请上传文件"})
		return
	}

	if file.Size > 100<<20 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件大小不能超过100MB"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件打开失败"})
		return
	}
	defer src.Close()

	f, err := excelize.OpenReader(src)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法解析XLSX文件"})
		return
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil || len(rows) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件为空或格式不正确"})
		return
	}

	imported := 0
	skipped := 0
	var batch []models.Question

	for i, row := range rows {
		if i == 0 {
			continue
		}
		if len(row) < 6 {
			skipped++
			continue
		}

		question := strings.TrimSpace(row[0])
		optionA := strings.TrimSpace(row[1])
		optionB := strings.TrimSpace(row[2])
		optionC := strings.TrimSpace(row[3])
		optionD := strings.TrimSpace(row[4])
		answer := strings.TrimSpace(strings.ToUpper(row[5]))
		explanation := ""
		if len(row) > 6 {
			explanation = strings.TrimSpace(row[6])
		}

		if question == "" || optionA == "" || optionB == "" || optionC == "" || optionD == "" || answer == "" {
			skipped++
			continue
		}

		if answer != "A" && answer != "B" && answer != "C" && answer != "D" {
			skipped++
			continue
		}

		batch = append(batch, models.Question{
			UserID:      userID,
			CategoryID:  category.ID,
			Question:    question,
			OptionA:     optionA,
			OptionB:     optionB,
			OptionC:     optionC,
			OptionD:     optionD,
			Answer:      answer,
			Explanation: explanation,
		})
	}

	if len(batch) > 0 {
		database.DB.Transaction(func(tx *gorm.DB) error {
			for i := 0; i < len(batch); i += 500 {
				end := i + 500
				if end > len(batch) {
					end = len(batch)
				}
				if err := tx.Create(batch[i:end]).Error; err != nil {
					return err
				}
				imported += end - i
			}
			return nil
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "导入完成",
		"imported": imported,
		"total":    len(rows) - 1,
		"errors":   skipped,
	})
}

func GetQuestions(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	_, ownerID, _, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	var questions []models.Question
	database.DB.Where("category_id = ? AND user_id = ?", categoryID, ownerID).
		Order("id ASC").Find(&questions)

	c.JSON(http.StatusOK, questions)
}

func DeleteQuestion(c *gin.Context) {
	userID := c.GetUint("user_id")
	questionID := c.Param("id")

	var question models.Question
	if err := database.DB.Where("id = ? AND user_id = ?", questionID, userID).First(&question).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "题目不存在或无权限"})
		return
	}

	database.DB.Where("question_id = ?", question.ID).Delete(&models.QuestionRecord{})
	database.DB.Delete(&question)

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

func getQuestionWithAccess(userID uint, questionID string) (*models.Question, error) {
	var question models.Question
	if err := database.DB.First(&question, questionID).Error; err != nil {
		return nil, err
	}
	_, _, _, err := CheckCategoryAccess(userID, fmt.Sprintf("%d", question.CategoryID))
	if err != nil {
		return nil, err
	}
	return &question, nil
}
