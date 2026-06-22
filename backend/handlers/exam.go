package handlers

import (
	"math"
	"math/rand"
	"net/http"
	"strconv"
	"study-quiz/database"
	"study-quiz/models"
	"time"

	"github.com/gin-gonic/gin"
)

func StartExam(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	_, ownerID, _, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	var req struct {
		Count int `json:"count"`
	}
	c.ShouldBindJSON(&req)
	if req.Count <= 0 {
		req.Count = 50
	}

	var singles, multiples []models.Question
	database.DB.Where("category_id = ? AND user_id = ? AND qtype = ?", categoryID, ownerID, "single").Find(&singles)
	database.DB.Where("category_id = ? AND user_id = ? AND qtype = ?", categoryID, ownerID, "multiple").Find(&multiples)

	availSingle := len(singles)
	availMulti := len(multiples)
	if availSingle == 0 && availMulti == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该分类暂无题目"})
		return
	}

	var singleN, multiN int
	switch {
	case availSingle > 0 && availMulti > 0:
		singleN = int(math.Round(float64(req.Count) * 3.0 / 5.0))
		multiN = req.Count - singleN
		if singleN > availSingle {
			singleN = availSingle
		}
		if multiN > availMulti {
			multiN = availMulti
		}
	case availSingle > 0:
		singleN = req.Count
		if singleN > availSingle {
			singleN = availSingle
		}
	default:
		multiN = req.Count
		if multiN > availMulti {
			multiN = availMulti
		}
	}

	rand.Shuffle(len(singles), func(i, j int) { singles[i], singles[j] = singles[j], singles[i] })
	rand.Shuffle(len(multiples), func(i, j int) { multiples[i], multiples[j] = multiples[j], multiples[i] })

	exam := make([]models.Question, 0, singleN+multiN)
	exam = append(exam, singles[:singleN]...)
	exam = append(exam, multiples[:multiN]...)
	rand.Shuffle(len(exam), func(i, j int) { exam[i], exam[j] = exam[j], exam[i] })

	c.JSON(http.StatusOK, gin.H{
		"questions":      exam,
		"total":          len(exam),
		"single_count":   singleN,
		"multiple_count": multiN,
	})
}

func SubmitExam(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	_, ownerID, _, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	var req struct {
		Answers  map[string]string `json:"answers"`
		Duration int               `json:"duration"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || len(req.Answers) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提交答案"})
		return
	}

	catID, _ := strconv.ParseUint(categoryID, 10, 32)

	correct := 0
	total := 0
	review := make([]gin.H, 0, len(req.Answers))

	for qidStr, ans := range req.Answers {
		qid, e := strconv.ParseUint(qidStr, 10, 32)
		if e != nil {
			continue
		}
		var q models.Question
		if database.DB.Where("id = ? AND category_id = ? AND user_id = ?", qid, catID, ownerID).First(&q).Error != nil {
			continue
		}

		userAnswer := NormalizeAnswer(ans)
		correctAnswer := NormalizeAnswer(q.Answer)
		isCorrect := 0
		if userAnswer != "" && userAnswer == correctAnswer {
			isCorrect = 1
			correct++
		}
		total++

		database.DB.Create(&models.QuestionRecord{
			UserID:     userID,
			QuestionID: q.ID,
			UserAnswer: userAnswer,
			IsCorrect:  isCorrect,
			AnsweredAt: time.Now(),
		})

		review = append(review, gin.H{
			"question_id":    q.ID,
			"user_answer":    userAnswer,
			"correct_answer": correctAnswer,
			"is_correct":     isCorrect == 1,
			"explanation":    q.Explanation,
		})
	}

	score := 0.0
	if total > 0 {
		score = math.Round(float64(correct)/float64(total)*1000) / 10
	}

	database.DB.Create(&models.PracticeResult{
		UserID:       userID,
		CategoryID:   uint(catID),
		Mode:         "exam",
		TotalCount:   total,
		CorrectCount: correct,
		Score:        score,
		Duration:     req.Duration,
		CompletedAt:  time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{
		"score":         score,
		"correct_count": correct,
		"total_count":   total,
		"duration":      req.Duration,
		"review":        review,
	})
}
