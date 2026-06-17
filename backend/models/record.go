package models

import "time"

type QuestionRecord struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"not null;index"`
	QuestionID uint      `json:"question_id" gorm:"not null;index"`
	UserAnswer string    `json:"user_answer" gorm:"not null"`
	IsCorrect  int       `json:"is_correct" gorm:"not null"`
	AnsweredAt time.Time `json:"answered_at"`
}
