package models

import "time"

type Category struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	UserID         uint      `json:"user_id" gorm:"not null;index"`
	Name           string    `json:"name" gorm:"not null"`
	CreatedAt      time.Time `json:"created_at"`
	QuestionCount  int64     `json:"question_count" gorm:"-"`
	WrongCount     int64     `json:"wrong_count" gorm:"-"`
	PracticedCount int64     `json:"practiced_count" gorm:"-"`
}
