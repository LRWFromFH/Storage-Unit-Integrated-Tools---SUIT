package database

import (
	"backend/models"
	"math/rand"
	"strconv"
)

func Init() {
	Connect()
}

func DevInit(small int, medium int, large int, xlarge int, testing ...any) {
	if len(testing) > 0 {
		ConnectTest()
	} else {
		Connect()
	}
	var count int64
	DB.Model(&models.Customer{}).Count(&count)
	if count == 0 {
		var unit models.Unit
		for i := 1; i <= small; i++ {
			unit = models.Unit{
				UnitNumber: "Unit " + strconv.Itoa((1000 + i)),
				SizeType:   "5x5",
				Price:      74.95,
				Renter:     nil,
				Length:     5,
				Width:      5,
				Height:     10,
				Combined:   false,
			}
			DB.Create(&unit)
		}

		for i := 1; i <= medium; i++ {
			unit = models.Unit{
				UnitNumber: "Unit " + strconv.Itoa((2000 + i)),
				SizeType:   "5x10",
				Price:      99.95,
				Renter:     nil,
				Length:     5,
				Width:      10,
				Height:     10,
				Combined:   false,
			}
			DB.Create(&unit)
		}
		for i := 1; i <= large; i++ {
			unit = models.Unit{
				UnitNumber: "Unit " + strconv.Itoa((3000 + i)),
				SizeType:   "10x10",
				Price:      149.95,
				Renter:     nil,
				Length:     10,
				Width:      10,
				Height:     10,
				Combined:   false,
			}
			DB.Create(&unit)
		}
		for i := 1; i <= xlarge; i++ {
			unit = models.Unit{
				UnitNumber: "Unit " + strconv.Itoa((4000 + i)),
				SizeType:   "10x15",
				Price:      189.95,
				Renter:     nil,
				Length:     10,
				Width:      15,
				Height:     10,
				Combined:   false,
			}
			DB.Create(&unit)
		}
	}
	DB.Model(&models.Customer{}).Count(&count)
	if count == 0 {
		InsertCustomers()
	}
}

func InsertCustomers() {

	var customers []models.Customer

	var firstnames = []string{"John", "Jane",
		"Bob", "Alice",
		"Charlie", "Mary",
		"Bill", "Nancy",
		"Mike", "Samantha",
		"Jack", "Jill"}
	var lastnames = []string{"Smith", "Johnson",
		"Williams", "Erikson",
		"Ohara", "Diez",
		"Robinson", "Langenbach",
		"Hollis", "Stepp",
		"Jones", "Crum"}
	var phones = []string{"904-123-4567", "904-234-5678",
		"904-292-9404", "904-386-4298",
		"904-456-7890", "904-567-8901",
		"904-786-4242", "904-789-2038",
		"904-201-9675", "904-987-6543",
		"904-867-5309", "904-321-0987"}
	var addresses = []string{"123 Main Street", "123 Main Street",
		"456 Oak Avenue", "456 Oak Avenue",
		"121 Jump Street", "121 Jump Street",
		"789 Pine Road", "789 Pine Road",
		"23 International Parkyway", "23 International Parkyway",
		"321 Elm Boulevard", "321 Elm Boulevard"}
	var emails = []string{"example@example.com", "johndoe@email.com",
		"thisisanemail@email.com", "sample@sample.com",
		"boriswashere@I.here", "someemail@mail.uk",
		"example@example.com", "johndoe@email.com",
		"thisisanemail@email.com", "sample@sample.com",
		"boriswashere@I.here", "someemail@mail.uk"}

	for _, firstName := range firstnames {
		for _, lastName := range lastnames {
			cus := models.Customer{
				FirstName: firstName,
				LastName:  lastName,
				Phone:     phones[rand.Intn(len(phones))],
				Address:   addresses[rand.Intn(len(addresses))],
				Email:     emails[rand.Intn(len(emails))],
			}

			//customer := models.Customer{
			//	FirstName: "John",
			//	LastName:  "Doe",
			//	Address:   "11490 San Jose Blvd",
			//	Email:     "john.doe@email.com",
			//	Phone:     "123-456-7890",
			//}

			customers = append(customers, cus)
		}
	}

	for _, cus := range customers {
		DB.Create(&cus)
	}

}
