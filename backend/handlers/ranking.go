package handlers

import (
	"math"
	"net/http"
	"sort"
	"study-quiz/database"
	"study-quiz/models"
	"time"

	"github.com/gin-gonic/gin"
)

type RankItem struct {
	UserID         uint       `json:"user_id"`
	Username       string     `json:"username"`
	AttemptCount   int        `json:"attempt_count"`
	HighestScore   float64    `json:"highest_score"`
	LowestScore    float64    `json:"lowest_score"`
	AvgScore       float64    `json:"avg_score"`
	LastPracticeAt *time.Time `json:"last_practice_at"`
}

func GetRanking(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	category, ownerID, _, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	var totalQuestions int64
	database.DB.Model(&models.Question{}).Where("category_id = ? AND user_id = ?", category.ID, ownerID).Count(&totalQuestions)

	var userIDs []uint
	userIDs = append(userIDs, ownerID)
	var members []models.CategoryMember
	database.DB.Where("category_id = ?", category.ID).Find(&members)
	for _, m := range members {
		userIDs = append(userIDs, m.UserID)
	}

	var users []models.User
	database.DB.Where("id IN ?", userIDs).Find(&users)

	var results []models.PracticeResult
	database.DB.Where("category_id = ? AND user_id IN ? AND mode = ?", category.ID, userIDs, "exam").Find(&results)

	userResults := map[uint][]models.PracticeResult{}
	for _, r := range results {
		userResults[r.UserID] = append(userResults[r.UserID], r)
	}

	var ranking []RankItem
	for _, u := range users {
		item := RankItem{
			UserID:   u.ID,
			Username: u.Username,
		}
		if rs, ok := userResults[u.ID]; ok && len(rs) > 0 {
			item.AttemptCount = len(rs)
			item.HighestScore = rs[0].Score
			item.LowestScore = rs[0].Score
			var totalScore float64
			var latest time.Time
			for _, r := range rs {
				totalScore += r.Score
				if r.Score > item.HighestScore {
					item.HighestScore = r.Score
				}
				if r.Score < item.LowestScore {
					item.LowestScore = r.Score
				}
				if r.CompletedAt.After(latest) {
					latest = r.CompletedAt
				}
			}
			item.AvgScore = math.Round(totalScore/float64(len(rs))*10) / 10
			t := latest
			item.LastPracticeAt = &t
		}
		ranking = append(ranking, item)
	}

	sort.Slice(ranking, func(i, j int) bool {
		if ranking[i].HighestScore != ranking[j].HighestScore {
			return ranking[i].HighestScore > ranking[j].HighestScore
		}
		return ranking[i].Username < ranking[j].Username
	})

	c.JSON(http.StatusOK, gin.H{
		"ranking":         ranking,
		"total_questions": totalQuestions,
	})
}

type MemberItem struct {
	UserID   uint      `json:"user_id"`
	Username string    `json:"username"`
	Role     string    `json:"role"`
	JoinedAt time.Time `json:"joined_at"`
}

func GetMembers(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	category, ownerID, _, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	var owner models.User
	database.DB.First(&owner, ownerID)

	var result []MemberItem
	result = append(result, MemberItem{
		UserID:   owner.ID,
		Username: owner.Username,
		Role:     "owner",
		JoinedAt: category.CreatedAt,
	})

	var members []models.CategoryMember
	database.DB.Where("category_id = ?", category.ID).Order("joined_at ASC").Find(&members)
	for _, m := range members {
		var u models.User
		if database.DB.First(&u, m.UserID).Error == nil {
			result = append(result, MemberItem{
				UserID:   u.ID,
				Username: u.Username,
				Role:     "member",
				JoinedAt: m.JoinedAt,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"members":  result,
		"owner_id": ownerID,
	})
}

func RemoveMember(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")
	memberID := c.Param("uid")

	var category models.Category
	if err := database.DB.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限"})
		return
	}

	database.DB.Where("user_id = ? AND category_id = ?", memberID, categoryID).Delete(&models.CategoryMember{})
	database.DB.Where("user_id = ? AND category_id = ?", memberID, categoryID).Delete(&models.PracticeProgress{})
	database.DB.Where("user_id = ? AND category_id = ?", memberID, categoryID).Delete(&models.PracticeResult{})

	c.JSON(http.StatusOK, gin.H{"message": "已移除"})
}
