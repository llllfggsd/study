package database

import (
	"fmt"
	"os"
	"study-quiz/models"

	"github.com/glebarez/sqlite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	os.MkdirAll("data", 0755)

	var err error
	DB, err = gorm.Open(sqlite.Open("data/study.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database: " + err.Error())
	}

	DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Question{},
		&models.QuestionRecord{},
	)

	seedAdmin()
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
