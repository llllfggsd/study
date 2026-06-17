package handlers

import (
	"net/http"
	"strings"
	"study-quiz/database"
	"study-quiz/models"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

func ImportQuestions(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	var category models.Category
	if err := database.DB.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请上传文件"})
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
	errors := []string{}

	for i, row := range rows {
		if i == 0 {
			continue
		}
		if len(row) < 6 {
			errors = append(errors, "")
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
			errors = append(errors, "")
			continue
		}

		if answer != "A" && answer != "B" && answer != "C" && answer != "D" {
			errors = append(errors, "")
			continue
		}

		q := models.Question{
			UserID:      userID,
			CategoryID:  category.ID,
			Question:    question,
			OptionA:     optionA,
			OptionB:     optionB,
			OptionC:     optionC,
			OptionD:     optionD,
			Answer:      answer,
			Explanation: explanation,
		}
		if err := database.DB.Create(&q).Error; err == nil {
			imported++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "导入完成",
		"imported": imported,
		"total":    len(rows) - 1,
		"errors":   len(errors),
	})
}

func GetQuestions(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	var questions []models.Question
	database.DB.Where("category_id = ? AND user_id = ?", categoryID, userID).
		Order("id ASC").Find(&questions)

	c.JSON(http.StatusOK, questions)
}

func DeleteQuestion(c *gin.Context) {
	userID := c.GetUint("user_id")
	questionID := c.Param("id")

	var question models.Question
	if err := database.DB.Where("id = ? AND user_id = ?", questionID, userID).First(&question).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	database.DB.Where("question_id = ?", question.ID).Delete(&models.QuestionRecord{})
	database.DB.Delete(&question)

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
