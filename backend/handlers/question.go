package handlers

import (
	"fmt"
	"net/http"
	"sort"
	"strings"
	"study-quiz/database"
	"study-quiz/models"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

func cell(row []string, idx int) string {
	if idx < 0 || idx >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[idx])
}

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

	header := rows[0]
	questionCol, answerCol, explanationCol := -1, -1, -1
	type optCol struct {
		letter byte
		idx    int
	}
	var optCols []optCol

	for i, h := range header {
		h = strings.TrimSpace(h)
		switch h {
		case "问题", "题目", "question", "Question":
			questionCol = i
		case "答案", "正确答案", "answer", "Answer":
			answerCol = i
		case "解析", "分析", "explanation", "Explanation":
			explanationCol = i
		default:
			if len(h) == 1 && h[0] >= 'A' && h[0] <= 'Z' {
				optCols = append(optCols, optCol{letter: h[0], idx: i})
			}
		}
	}

	sort.Slice(optCols, func(a, b int) bool { return optCols[a].letter < optCols[b].letter })

	if questionCol == -1 || answerCol == -1 || len(optCols) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "表头需包含 [问题]、若干大写字母选项列(A、B、C…) 和 [答案]"})
		return
	}

	imported := 0
	skipped := 0
	singleCount := 0
	multipleCount := 0
	var batch []models.Question

	for i := 1; i < len(rows); i++ {
		row := rows[i]

		question := cell(row, questionCol)
		if question == "" {
			skipped++
			continue
		}

		var optVals []string
		for _, oc := range optCols {
			optVals = append(optVals, cell(row, oc.idx))
		}
		lastNonEmpty := -1
		for j, v := range optVals {
			if v != "" {
				lastNonEmpty = j
			}
		}
		if lastNonEmpty < 1 {
			skipped++
			continue
		}
		options := optVals[:lastNonEmpty+1]
		gap := false
		for _, v := range options {
			if v == "" {
				gap = true
				break
			}
		}
		if gap {
			skipped++
			continue
		}

		answer := NormalizeAnswer(cell(row, answerCol))
		if answer == "" {
			skipped++
			continue
		}
		valid := true
		for _, ch := range answer {
			if int(ch-'A') >= len(options) {
				valid = false
				break
			}
		}
		if !valid {
			skipped++
			continue
		}

		qtype := "single"
		if len(answer) > 1 {
			qtype = "multiple"
			multipleCount++
		} else {
			singleCount++
		}

		q := models.Question{
			UserID:      userID,
			CategoryID:  category.ID,
			Question:    question,
			QType:       qtype,
			Options:     options,
			Answer:      answer,
			Explanation: cell(row, explanationCol),
		}
		legacy := []string{"", "", "", ""}
		for j := 0; j < len(options) && j < 4; j++ {
			legacy[j] = options[j]
		}
		q.OptionA, q.OptionB, q.OptionC, q.OptionD = legacy[0], legacy[1], legacy[2], legacy[3]

		batch = append(batch, q)
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
		"message":        "导入完成",
		"imported":       imported,
		"single_count":   singleCount,
		"multiple_count": multipleCount,
		"total":          len(rows) - 1,
		"errors":         skipped,
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
