package services

import (
	"backend/database"
	"backend/models"
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"

	"bytes"
)

type InventoryReportRow struct {
	Size        string
	Description string
	SqFt        int
	Rent        float64
	RentPerSqFt float64
	TotalRooms  int
	TotalSqFt   int
	Occupied    int
	Vacant      int
	Cleaning    int
	Damaged     int
	Reserved    int
	OccSqFt     int
	GrossIncome float64
	PercentUtil float64
	ActualRent  float64
}

func GenerateInventoryReport() ([]InventoryReportRow, error) {
	var units []models.Unit
	if err := database.DB.Find(&units).Error; err != nil {
		return nil, err
	}

	// Map to group units by SizeType
	groups := make(map[string][]models.Unit)
	for _, u := range units {
		groups[u.SizeType] = append(groups[u.SizeType], u)
	}

	var rows []InventoryReportRow
	for size, unitList := range groups {
		row := InventoryReportRow{
			Size:       size,
			TotalRooms: len(unitList),
		}

		for _, u := range unitList {
			// Basic dimensions (assuming first unit in group sets the standard)
			row.Description = u.SizeType
			row.SqFt = u.Length * u.Width
			row.Rent = u.Price
			row.TotalSqFt += row.SqFt

			// Logic based on CustomerID and Status
			if u.CustomerID != nil {
				row.Occupied++
				row.OccSqFt += row.SqFt
				row.ActualRent += u.Price
			} else {
				row.Vacant++
			}

		}

		// Calculated fields
		if row.SqFt > 0 {
			row.RentPerSqFt = row.Rent / float64(row.SqFt)
		}
		row.GrossIncome = float64(row.TotalRooms) * row.Rent
		if row.TotalSqFt > 0 {
			row.PercentUtil = (float64(row.OccSqFt) / float64(row.TotalSqFt)) * 100
		}

		rows = append(rows, row)
	}
	return rows, nil
}

func ExportInventoryPDF(rows []InventoryReportRow) ([]byte, error) {
	pdf := gofpdf.New("L", "mm", "A4", "") // Landscape orientation
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(40, 10, "Daily Unit Inventory & Revenue Report")
	pdf.Ln(12)

	// Table Header
	pdf.SetFont("Arial", "B", 8)
	pdf.SetFillColor(200, 200, 200)
	headers := []string{"Size", "Description", "SqFt", "Rent", "Rooms", "Tot SqFt", "Occ", "Vac", "Gross Inc", "Util%"}
	widths := []float64{15, 30, 15, 20, 15, 20, 15, 15, 25, 15}

	for i, str := range headers {
		pdf.CellFormat(widths[i], 7, str, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Table Body
	pdf.SetFont("Arial", "", 8)
	for _, row := range rows {
		pdf.CellFormat(widths[0], 6, row.Size, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[1], 6, row.Description, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[2], 6, fmt.Sprintf("%d", row.SqFt), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[3], 6, fmt.Sprintf("$%.2f", row.Rent), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[4], 6, fmt.Sprintf("%d", row.TotalRooms), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[5], 6, fmt.Sprintf("%d", row.TotalSqFt), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[6], 6, fmt.Sprintf("%d", row.Occupied), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[7], 6, fmt.Sprintf("%d", row.Vacant), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[8], 6, fmt.Sprintf("$%.2f", row.GrossIncome), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[9], 6, fmt.Sprintf("%.1f%%", row.PercentUtil), "1", 0, "R", false, 0, "")
		pdf.Ln(-1)
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// GenerateLockoutReport fetches deactivated units and returns a PDF byte buffer
func GenerateLockoutReport() ([]byte, error) {
	var units []models.Unit

	// Query: Find deactivated units.
	// Fetch units
	err := database.DB.Preload("Renter").
		Where("status = ? AND lockout_reported = ?", models.UnitStatusDeactivated, false).
		Find(&units).Error

	if err != nil || len(units) == 0 {
		return nil, err
	}

	// Generate PDF (Only update if this succeeds!)
	pdfBytes, err := ExportLockoutPDF(units)
	if err != nil {
		return nil, err
	}

	// Batch Update: Mark all fetched units as reported in one query
	unitIDs := make([]uint, len(units))
	for i, u := range units {
		unitIDs[i] = u.ID
	}

	err = database.DB.Model(&models.Unit{}).
		Where("id IN ?", unitIDs).
		Update("lockout_reported", true).Error

	if err != nil {
		// The PDF was generated but the DB didn't update.
		fmt.Printf("Warning: PDF generated but failed to update units: %v\n", err)
	}

	return pdfBytes, nil
}

func ExportLockoutPDF(units []models.Unit) ([]byte, error) {
	// L = Landscape, mm = millimeters, A4 size
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.AddPage()

	// Title
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, fmt.Sprintf("Lockout Report - %s", time.Now().Format("Jan 02, 2006")))
	pdf.Ln(12)

	// Table Header Configuration
	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(220, 220, 220)

	headers := []string{"Unit #", "Size", "Renter Name", "Dimensions", "Price", "Next Due", "Status"}
	widths := []float64{25, 30, 60, 40, 25, 40, 40}

	for i, str := range headers {
		pdf.CellFormat(widths[i], 7, str, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Table Body
	pdf.SetFont("Arial", "", 9)
	for _, unit := range units {
		// Formatting data
		renterName := "N/A"
		if unit.Renter != nil {
			renterName = unit.Renter.FirstName + " " + unit.Renter.LastName
		}

		dueDate := "N/A"
		if unit.NextDueDate != nil {
			dueDate = unit.NextDueDate.Format("2006-01-02")
		}

		dims := fmt.Sprintf("%dx%dx%d", unit.Length, unit.Width, unit.Height)

		// Render Rows
		pdf.CellFormat(widths[0], 6, unit.UnitNumber, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[1], 6, unit.SizeType, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[2], 6, renterName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[3], 6, dims, "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[4], 6, fmt.Sprintf("$%.2f", unit.Price), "1", 0, "R", false, 0, "")
		pdf.CellFormat(widths[5], 6, dueDate, "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[6], 6, unit.Status, "1", 0, "L", false, 0, "")
		pdf.Ln(-1)

		// Simple Page Break logic
		if pdf.GetY() > 180 {
			pdf.AddPage()
		}
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

/*type UnitMixRow struct {
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
*/
