package models

import "time"

type Question struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"not null;index"`
	CategoryID  uint      `json:"category_id" gorm:"not null;index"`
	Question    string    `json:"question" gorm:"not null"`
	OptionA     string    `json:"option_a" gorm:"not null"`
	OptionB     string    `json:"option_b" gorm:"not null"`
	OptionC     string    `json:"option_c" gorm:"not null"`
	OptionD     string    `json:"option_d" gorm:"not null"`
	Answer      string    `json:"answer" gorm:"not null"`
	Explanation string    `json:"explanation"`
	CreatedAt   time.Time `json:"created_at"`
}
