package models

import "time"

type Category struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	UserID         uint      `json:"user_id" gorm:"not null;index"`
	Name           string    `json:"name" gorm:"not null"`
	ShareCode      string    `json:"share_code" gorm:"uniqueIndex"`
	CreatedAt      time.Time `json:"created_at"`
	QuestionCount  int64     `json:"question_count" gorm:"-"`
	WrongCount     int64     `json:"wrong_count" gorm:"-"`
	PracticedCount int64     `json:"practiced_count" gorm:"-"`
	IsOwner        bool      `json:"is_owner" gorm:"-"`
	OwnerName      string    `json:"owner_name" gorm:"-"`
}
