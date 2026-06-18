package database

import (
	"fmt"
	"math/rand"
	"os"
	"study-quiz/models"
	"time"

	"github.com/glebarez/sqlite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	os.MkdirAll("data", 0755)

	var err error
	DB, err = gorm.Open(sqlite.Open("data/study.db?_journal_mode=WAL&_busy_timeout=5000"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database: " + err.Error())
	}

	sqlDB, _ := DB.DB()
	sqlDB.SetMaxOpenConns(8)
	sqlDB.SetMaxIdleConns(4)
	sqlDB.SetConnMaxLifetime(time.Hour)

	DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Question{},
		&models.QuestionRecord{},
		&models.PracticeProgress{},
		&models.CategoryMember{},
		&models.PracticeResult{},
	)

	seedAdmin()
	fixShareCodes()
}

func seedAdmin() {
	var user models.User
	if DB.Where("username = ?", "jialin").First(&user).Error == nil {
		return
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte("jialin123"), bcrypt.DefaultCost)
	if err := DB.Create(&models.User{
		Username:     "jialin",
		PasswordHash: string(hash),
	}).Error; err != nil {
		fmt.Println("创建管理员失败:", err)
	} else {
		fmt.Println("管理员账户 jialin 已创建")
	}
}

func fixShareCodes() {
	var categories []models.Category
	DB.Where("share_code = '' OR share_code IS NULL").Find(&categories)
	for _, cat := range categories {
		code := genCode()
		DB.Model(&cat).Update("share_code", code)
	}
}

func genCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	code := make([]byte, 6)
	for i := range code {
		code[i] = chars[rand.Intn(len(chars))]
	}
	return string(code)
}
