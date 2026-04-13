package services

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/johnfercher/maroto/pkg/color"
	"github.com/johnfercher/maroto/pkg/consts"
	"github.com/johnfercher/maroto/pkg/pdf"
	"github.com/johnfercher/maroto/pkg/props"
)

// type Stats struct {
// 	VacantUnits   int
// 	OccupiedUnits int

// 	TotalUnits          int
// 	TotalCustomers      int
// 	TotalRevenue        float64
// 	TotalProfit         float64
// 	TotalExpenses       float64
// 	TotalInvoices       float64
// 	TotalUnpaidInvoices float64
// }

type UnitMixRow struct {
	Size        string
	Description string
	SqFt        int
	Rent        float64
	TotalRooms  int
	Occupied    int
	Vacant      int
	GrossIncome float64
	ActualRent  float64
}

func getOccupancyReport(c *gin.Context) {
	// 1. Initialize Maroto v1 (Landscape for your wide table)
	m := pdf.NewMaroto(consts.Landscape, consts.A4)
	m.SetPageMargins(10, 10, 10)

	// 2. Build the Title
	m.Row(10, func() {
		m.Col(12, func() {
			m.Text("Occupancy Vacancy Unit Mix Rates", props.Text{
				Size:  14,
				Style: consts.Bold,
				Align: consts.Left,
			})
		})
	})

	// 3. Define Table Data (Matching your uploaded image)
	header := []string{"Size", "Description", "SqFt", "Rent", "Rooms", "Occ", "Vac", "Clean", "Gross Inc", "Actual"}

	contents := [][]string{
		{"5X5X10", "Int Climate St 1", "25", "$89.95", "8", "7", "1", "0", "$719.60", "$629.65"},
		{"5X5X10", "Int Climate St 2", "25", "$84.95", "10", "9", "1", "0", "$849.50", "$764.55"},
		{"5X10X10", "Int Climate St 1", "50", "$124.95", "33", "28", "4", "1", "$4,123.35", "$3,498.60"},
		{"10X5X10", "Int Climate St 3", "50", "$114.95", "11", "8", "3", "0", "$1,264.45", "$919.60"},
	}

	// 4. Create Table with Zebra Stripes (Grey alternating rows)
	m.TableList(header, contents, props.TableList{
		HeaderProp: props.TableListContent{
			Size:      9,
			GridSizes: []uint{1, 2, 1, 1, 1, 1, 1, 1, 1, 2}, // Adjust column widths
		},
		ContentProp: props.TableListContent{
			Size:      8,
			GridSizes: []uint{1, 2, 1, 1, 1, 1, 1, 1, 1, 2},
		},
		Align:                consts.Left,
		AlternatedBackground: &color.Color{Red: 245, Green: 245, Blue: 245},
		HeaderContentSpace:   1.0,
		Line:                 false,
	})

	// 5. Output to Buffer
	buffer, err := m.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "PDF generation failed"})
		return
	}

	// 6. Serve via Gin
	c.Header("Content-Disposition", "inline; filename=occupancy_report.pdf")
	c.Data(http.StatusOK, "application/pdf", buffer.Bytes())
}
