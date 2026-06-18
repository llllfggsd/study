package models

import "time"

type CategoryMember struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"not null;uniqueIndex:idx_user_category"`
	CategoryID uint      `json:"category_id" gorm:"not null;uniqueIndex:idx_user_category"`
	JoinedAt   time.Time `json:"joined_at"`
}
