import jsPDF from "jspdf";

export function exportToPDF({
  title,
  dateRange,
  columns,
  data,
  columnLabels = [],
  currencyColumns = [],
  mergeColumns = {}, // { columnName: [field1, field2, ...] }
  orientation = 'portrait',
  financialSummary
}: {
  title: string;
  dateRange: string;
  columns: string[];
  data: any[];
  columnLabels?: string[];
  currencyColumns?: string[];
  mergeColumns?: Record<string, string[]>;
  orientation?: 'portrait' | 'landscape';
  financialSummary?: {
    totalIncome: number;
    totalExpense: number;
  };
}) {
  const doc = new jsPDF({ orientation });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const startY = 30;
  let currentY = startY;

  // Company Name
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(8, 61, 166); // Dark blue
  doc.text("Shree Krishna Handloom", pageWidth / 2, currentY, { align: "center" });
  currentY += 15;

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, currentY, { align: "center" });
  currentY += 10;

  // Date Range
  doc.setFontSize(11);
  doc.text(dateRange, pageWidth / 2, currentY, { align: "center" });
  currentY += 20;

  if (!data || data.length === 0) {
    doc.text("No data available", margin, currentY);
    doc.save(`${title}.pdf`);
    return;
  }

  // Table headers
  const labels = columnLabels.length ? columnLabels : columns;
  const colWidth = (pageWidth - 2 * margin) / labels.length;
  
  // Draw header row
  doc.setFillColor(8, 61, 166);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  
  labels.forEach((label, index) => {
    const x = margin + index * colWidth;
    doc.rect(x, currentY - 8, colWidth, 12, 'F');
    doc.text(label, x + 2, currentY, { align: "left" });
  });
  currentY += 15;

  // Draw data rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = startY;
    }

    // Draw row background (alternating colors)
    const bgColor = rowIndex % 2 === 0 ? [245, 245, 245] : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(margin, currentY - 8, pageWidth - 2 * margin, 12, 'F');

    // Draw cell borders and content
    columns.forEach((col, colIndex) => {
      const x = margin + colIndex * colWidth;
      const cellValue = getCellValue(row, col, mergeColumns, currencyColumns);
      
      // Draw cell border
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, currentY - 8, colWidth, 12, 'S');
      
      // Draw cell content
      doc.setTextColor(0, 0, 0);
      doc.text(cellValue, x + 2, currentY, { align: "left" });
    });
    
    currentY += 15;
  });

  // Financial Summary Section (if applicable)
  if (title === "Financial Summary" && financialSummary) {
    currentY += 10;
    
    // Header
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(8, 61, 166);
    doc.text("Financial Summary", margin, currentY);
    currentY += 10;
    
    // Summary rows
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    const totalIncome = financialSummary?.totalIncome || 0;
    const totalExpense = financialSummary?.totalExpense || 0;
    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) + "%" : "0%";
    
    const summaryRows = [
      ["Total Income", `Rs. ${totalIncome.toLocaleString()}`],
      ["Total Expense", `Rs. ${totalExpense.toLocaleString()}`],
      ["Net Profit", `Rs. ${netProfit.toLocaleString()}`],
      ["Profit Margin", profitMargin]
    ];
    
    summaryRows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38); // Red for value
      doc.text(value, margin + 80, currentY, { align: "left" });
      doc.setTextColor(0, 0, 0);
      currentY += 8;
    });
  }

  // Save PDF
  doc.save(`${title}.pdf`);
}

// Helper function to get cell value
function getCellValue(row: any, col: string, mergeColumns: Record<string, string[]>, currencyColumns: string[]): string {
      if (mergeColumns && mergeColumns[col]) {
        return mergeColumns[col]
          .map(field => {
            let val = row[field];
            if (currencyColumns.includes(field) && typeof val === 'number') {
              return `Rs. ${val.toLocaleString()}`;
            }
            return val;
          })
          .join(" | ");
      }
  
      let val = row[col];
      if (currencyColumns.includes(col) && typeof val === 'number') {
        return `Rs. ${val.toLocaleString()}`;
      }
  
  return val?.toString() || '';
}
