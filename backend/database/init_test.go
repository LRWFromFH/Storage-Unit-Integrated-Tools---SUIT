package database_test

import (
	"backend/database"
	"backend/models"
	"testing"
)

func Test_Init(t *testing.T) {

	small, medium, large, xlarge := 50, 35, 25, 15
	var count int64

	database.DevInit(small, medium, large, xlarge, true)

	database.DB.Model(&models.Unit{}).Where("size_type = ?", "5x5").Count(&count)
	if int(count) != small {
		t.Errorf("Expected 50 units of size 5x5, but found %d", count)
		return
	}
	database.DB.Model(&models.Unit{}).Where("size_type = ?", "5x10").Count(&count)
	if int(count) != medium {
		t.Errorf("Expected 35 units of size 5x10, but found %d", count)
		return
	}
	database.DB.Model(&models.Unit{}).Where("size_type = ?", "10x10").Count(&count)
	if int(count) != large {
		t.Errorf("Expected 25 units of size 10x10, but found %d", count)
		return
	}
	database.DB.Model(&models.Unit{}).Where("size_type = ?", "10x15").Count(&count)
	if int(count) != xlarge {
		t.Errorf("Expected 15 units of size 10x15, but found %d", count)
		return
	}

	t.Logf("Successfully initialized %d units: %d small, %d medium, %d large, %d xlarge", small+medium+large+xlarge, small, medium, large, xlarge)

}
