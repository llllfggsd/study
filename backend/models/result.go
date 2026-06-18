package models

import "time"

type PracticeResult struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	UserID       uint      `json:"user_id" gorm:"not null;index"`
	CategoryID   uint      `json:"category_id" gorm:"not null;index"`
	Mode         string    `json:"mode" gorm:"not null"`
	TotalCount   int       `json:"total_count" gorm:"not null"`
	CorrectCount int       `json:"correct_count" gorm:"not null"`
	Score        float64   `json:"score" gorm:"not null"`
	Duration     int       `json:"duration" gorm:"not null"`
	CompletedAt  time.Time `json:"completed_at"`
}
