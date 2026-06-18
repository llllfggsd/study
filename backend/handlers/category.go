package handlers

import (
	"net/http"
	"study-quiz/database"
	"study-quiz/models"
	"time"

	"github.com/gin-gonic/gin"
)

func GetCategories(c *gin.Context) {
	userID := c.GetUint("user_id")

	var owned []models.Category
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&owned)
	for i := range owned {
		owned[i].IsOwner = true
		LoadCategoryStats(&owned[i], userID, userID)
	}

	var members []models.CategoryMember
	database.DB.Where("user_id = ?", userID).Find(&members)
	var joined []models.Category
	for _, m := range members {
		var cat models.Category
		if err := database.DB.First(&cat, m.CategoryID).Error; err == nil {
			cat.IsOwner = false
			var owner models.User
			if database.DB.First(&owner, cat.UserID).Error == nil {
				cat.OwnerName = owner.Username
			}
			LoadCategoryStats(&cat, userID, cat.UserID)
			joined = append(joined, cat)
		}
	}

	all := append(owned, joined...)
	c.JSON(http.StatusOK, all)
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

	var code string
	for {
		code = GenerateShareCode()
		var count int64
		database.DB.Model(&models.Category{}).Where("share_code = ?", code).Count(&count)
		if count == 0 {
			break
		}
	}

	category := models.Category{
		UserID:    userID,
		Name:      req.Name,
		ShareCode: code,
	}
	if err := database.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	category.IsOwner = true
	c.JSON(http.StatusOK, category)
}

func DeleteCategory(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	var category models.Category
	if err := database.DB.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在或无权限"})
		return
	}

	database.DB.Where("category_id = ?", category.ID).Delete(&models.CategoryMember{})
	database.DB.Where("category_id = ? AND user_id = ?", categoryID, userID).Delete(&models.Question{})
	database.DB.Where("category_id = ?", category.ID).Delete(&models.PracticeProgress{})
	database.DB.Delete(&category)

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

func GetCategory(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	category, ownerID, isOwner, err := CheckCategoryAccess(userID, categoryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分类不存在"})
		return
	}

	category.IsOwner = isOwner
	if !isOwner {
		var owner models.User
		if database.DB.First(&owner, ownerID).Error == nil {
			category.OwnerName = owner.Username
		}
	}
	LoadCategoryStats(category, userID, ownerID)

	c.JSON(http.StatusOK, category)
}

func JoinCategory(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		ShareCode string `json:"share_code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请输入分享码"})
		return
	}

	var category models.Category
	if err := database.DB.Where("share_code = ?", req.ShareCode).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "分享码无效"})
		return
	}

	if category.UserID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不能加入自己的题库"})
		return
	}

	var count int64
	database.DB.Model(&models.CategoryMember{}).Where("user_id = ? AND category_id = ?", userID, category.ID).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "已加入该题库"})
		return
	}

	database.DB.Create(&models.CategoryMember{
		UserID:     userID,
		CategoryID: category.ID,
		JoinedAt:   time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{"message": "加入成功", "category": category})
}

func LeaveCategory(c *gin.Context) {
	userID := c.GetUint("user_id")
	categoryID := c.Param("id")

	database.DB.Where("user_id = ? AND category_id = ?", userID, categoryID).Delete(&models.CategoryMember{})
	database.DB.Where("user_id = ? AND category_id = ?", userID, categoryID).Delete(&models.PracticeProgress{})

	c.JSON(http.StatusOK, gin.H{"message": "已退出"})
}
