package models

import "gorm.io/gorm"

// models/notes.go
type Note struct {
	gorm.Model
	CustomerID uint
	Content    string
	AuthorID   uint // Linked to Employee.ID
}

type NoteRequest struct {
	Content string `json:"content" binding:"required"`
}
