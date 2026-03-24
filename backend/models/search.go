package models

type SearchRequest struct {
	Query string `json:"query" binding:"required"`
}
