package models

import "gorm.io/gorm"

type SearchRequest struct {
	gorm.Model
	Query string `json:"query" binding:"required"`
}
