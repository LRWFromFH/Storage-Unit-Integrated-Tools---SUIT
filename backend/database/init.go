package database

import (
	"backend/models"
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
	var unit models.Unit
	for i := 1; i <= small; i++ {
		unit = models.Unit{
			UnitNumber: "Unit " + strconv.Itoa((1000 + i)),
			SizeType:   "5x5",
			Price:      74.95,
			Renter:     nil,
			CustomerID: nil,
		}
		DB.Create(&unit)
	}

	for i := 1; i <= medium; i++ {
		unit = models.Unit{
			UnitNumber: "Unit " + strconv.Itoa((2000 + i)),
			SizeType:   "5x10",
			Price:      99.95,
			Renter:     nil,
			CustomerID: nil,
		}
		DB.Create(&unit)
	}
	for i := 1; i <= large; i++ {
		unit = models.Unit{
			UnitNumber: "Unit " + strconv.Itoa((3000 + i)),
			SizeType:   "10x10",
			Price:      149.95,
			Renter:     nil,
			CustomerID: nil,
		}
		DB.Create(&unit)
	}
	for i := 1; i <= xlarge; i++ {
		unit = models.Unit{
			UnitNumber: "Unit " + strconv.Itoa((4000 + i)),
			SizeType:   "10x15",
			Price:      189.95,
			Renter:     nil,
			CustomerID: nil,
		}
		DB.Create(&unit)
	}
}
