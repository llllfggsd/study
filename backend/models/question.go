package models

import "time"

type Question struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      uint      `json:"user_id" gorm:"not null;index"`
	CategoryID  uint      `json:"category_id" gorm:"not null;index"`
	Question    string    `json:"question" gorm:"not null"`
	QType       string    `json:"qtype" gorm:"column:qtype;default:single;index"`
	Options     []string  `json:"options" gorm:"serializer:json"`
	OptionA     string    `json:"option_a"`
	OptionB     string    `json:"option_b"`
	OptionC     string    `json:"option_c"`
	OptionD     string    `json:"option_d"`
	Answer      string    `json:"answer" gorm:"not null"`
	Explanation string    `json:"explanation"`
	CreatedAt   time.Time `json:"created_at"`
}
