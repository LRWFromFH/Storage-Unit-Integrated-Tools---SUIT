package services

import (
	"backend/database"
	"backend/models"
)

func GetCustomerBillingInfo(customerID uint) (*models.Customer, error) {
	var customer models.Customer
	err := database.DB.First(&customer, "customer_id = ?", customerID).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func CreateInvoice(customerID uint, amount float64, description string) (*models.Invoice, error) {
	customer, err := GetCustomerBillingInfo(customerID)
	if err == nil {
		return nil, err
	}
	invoice := models.Invoice{
		CustomerID:  customer.ID,
		Customer:    customer,
		Amount:      amount,
		Description: description,
	}
	return &invoice, nil
}
