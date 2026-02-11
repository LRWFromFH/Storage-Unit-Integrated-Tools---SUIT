package models

import "gorm.io/gorm"

type Customer struct {
	gorm.Model
	//The following lines mean that some values can repeat
	// but the combination should be unique for each customer
	/* Example:
	John Doe, 904-123-4567, 1234 address lane
	Jane Doe, 904-123-4567, 1234 address lane
	*/
	FirstName string `gorm:"uniqueIndex:idx_customer_identity"`
	LastName  string `gorm:"uniqueIndex:idx_customer_identity"`
	Phone     string `gorm:"uniqueIndex:idx_customer_identity"`
	Address   string `gorm:"uniqueIndex:idx_customer_identity"`
	Email     string `gorm:"unique"` // Email is usually unique on its own
}
