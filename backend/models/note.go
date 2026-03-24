package models

import "gorm.io/gorm"

// models/notes.go
type Note struct {
	gorm.Model
	CustomerID uint
	Content    string
	AuthorID   uint // Linked to Employee.ID
}
