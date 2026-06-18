package models

import "time"

type PracticeProgress struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	UserID       uint      `json:"user_id" gorm:"not null"`
	CategoryID   uint      `json:"category_id" gorm:"not null"`
	Mode         string    `json:"mode" gorm:"not null"`
	CurrentIndex int       `json:"current_index" gorm:"default:0"`
	QuestionIDs  string    `json:"-" gorm:"type:text"`
	UpdatedAt    time.Time `json:"updated_at"`
}
