package models

import "gorm.io/gorm"

type Employee struct {
	gorm.Model
	SMID     string `json:"smid" gorm:"unique;column:smid"` //System Member ID
	Email    string `json:"email" gorm:"unique"`            //Company Email
	Password string `json:"password"`
	Role     string `json:"role"`
}
