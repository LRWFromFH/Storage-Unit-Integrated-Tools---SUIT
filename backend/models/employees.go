package models

import "gorm.io/gorm"

type Employee struct {
	gorm.Model
	SMID     string `json:"username" gorm:"unique"` //System Member ID
	Email    string `json:"email" gorm:"unique"`    //Company Email
	Password string `json:"password"`
	Role     string `json:"role"`
}
