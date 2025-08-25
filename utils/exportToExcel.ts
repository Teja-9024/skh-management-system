
import * as XLSX from "xlsx-js-style";

export function exportToExcel({
  title,
  dateRange,
  columns,
  data,
  columnLabels = [],
  currencyColumns = [],
  financialSummary
}: {
  title: string;
  dateRange: string;
  columns: string[];
  data: any[];
  columnLabels?: string[];
  currencyColumns?: string[];
  financialSummary?: {
    totalIncome: number;
    totalExpense: number;
  };
}) {
  // Special handling for billing reports
  if (title === "Billing Report") {
    exportBillingReportToExcel(data, dateRange);
    return;
  }

  // Prepare rows: title, date, blank, then table
  const rows: any[] = [];
  const colCount = columns.length;
  const thinBorder = {
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } }
};

  rows.push([
  {
    v: "Shree Krishna Handloom", // Updated company name
    s: {
      font: { sz: 16, bold: true, color: { rgb: "083da6" } }, // 25px and Blue
      alignment: { horizontal: "center" }
    }
  }
  ]);
  rows.push([
    {
      v: title,
      s: {
        font: { sz: 12, bold: true },
        alignment: { horizontal: "center", vertical: "center" }
      }
    }
  ]);
  rows.push([{
      v: dateRange,
      s: {
        font: { sz: 12, bold: true },
        alignment: { horizontal: "center", vertical: "center" }
      }
  }]);
  // Add header
  // rows.push(columnLabels.length ? columnLabels : columns);
  const header = (columnLabels.length ? columnLabels : columns).map(col => ({
    v: col,
    s: {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "083da6" } },
      alignment: { horizontal: "center" },
      border:thinBorder
    }
  }));
  rows.push(header);
  // Add data
  data.forEach(row => {
    const rowData = columns.map(col => {
      let val = row[col];
      if (currencyColumns.includes(col) && typeof val === 'number') {
        return {
          v: `₹${val.toLocaleString()}`,
          s: {
            alignment: { horizontal: "right" },
            font: { sz: 11 },
            border: thinBorder
          }
        };
      }
      return { v: val, s: { font: { sz: 11 }, border: thinBorder } };
    });
    rows.push(rowData);
  });

  // --- Financial Summary Section (only for Financial Summary report) ---
  if (title === "Financial Summary" && financialSummary) {
    // Add a blank row (full width)
    rows.push(Array(colCount).fill({ v: "" }));

    // Add the Financial Summary header row (merged)
    const summaryHeader = Array(colCount).fill({ v: "" });
    summaryHeader[0] = {
      v: "Financial Summary",
      s: {
        font: { bold: true, sz: 14, color: { rgb: "083da6" } }
      }
    };
    rows.push(summaryHeader);
    const summaryHeaderRowIndex = rows.length - 1;

    // Add summary rows (label + value, rest empty)
    const totalIncome = financialSummary?.totalIncome || 0;
    const totalExpense = financialSummary?.totalExpense || 0;
    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) + "%" : "0%";
    const summaryRows = [
      ["Total Income", `₹${totalIncome.toLocaleString()}`],
      ["Total Expense", `₹${totalExpense.toLocaleString()}`],
      ["Net Profit", `₹${netProfit.toLocaleString()}`],
      ["Profit Margin", profitMargin]
    ];
    summaryRows.forEach(([label, value]) => {
      const row = Array(colCount).fill({ v: "" });
      row[0] = {
        v: label,
        s: { font: { bold: true }, alignment: { horizontal: "left" } }
      };
      row[1] = {
        v: value,
        s: { font: { color: { rgb: "FF0000" }, bold: true }, alignment: { horizontal: "right" } }
      };
      rows.push(row);
    });

    // --- Worksheet and Merges ---
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const mergeRanges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } }, // Company name
      { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } }, // Title
      { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } }, // Date range
      { s: { r: summaryHeaderRowIndex, c: 0 }, e: { r: summaryHeaderRowIndex, c: colCount - 1 } } // Financial Summary header
    ];
    worksheet["!merges"] = mergeRanges;
    // Column widths
    const colWidths = columns.map((col, colIndex) => {
      let maxLen = col.length;
      data.forEach(row => {
        if (row[col] !== undefined && row[col] !== null) {
          const strLen = row[col].toString().length;
          maxLen = Math.max(maxLen, strLen);
        }
      });
      if (colIndex === 0) {
        const summaryLabels = ["Total Income", "Total Expense", "Net Profit", "Profit Margin", "Financial Summary"];
        const summaryMaxLen = Math.max(...summaryLabels.map(label => label.length));
        maxLen = Math.max(maxLen, summaryMaxLen);
      }
      return { wch: Math.max(12, maxLen + 2) };
    });
    worksheet["!cols"] = colWidths;
    // Write file
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${title}.xlsx`);
    return;
  }

  // --- Default worksheet creation for other reports ---
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const mergeRanges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } }
  ];
  worksheet["!merges"] = mergeRanges;
  const colWidths = columns.map((col, colIndex) => {
    let maxLen = col.length;
    data.forEach(row => {
      if (row[col] !== undefined && row[col] !== null) {
        const strLen = row[col].toString().length;
        maxLen = Math.max(maxLen, strLen);
      }
    });
    return { wch: Math.max(12, maxLen + 2) };
  });
  worksheet["!cols"] = colWidths;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${title}.xlsx`);
}

// Special function for billing reports to match the image format
function exportBillingReportToExcel(data: any[], dateRange: string) {
  const rows: any[] = [];
  
  // Company header
  rows.push([{
    v: "SHRI KARISHNA HANDLOOM",
    s: {
      font: { sz: 16, bold: true, color: { rgb: "083da6" } },
      alignment: { horizontal: "center" }
    }
  }]);
  
  // Title
  rows.push([{
    v: "Billing Report",
    s: {
      font: { sz: 14, bold: true },
      alignment: { horizontal: "center" }
    }
  }]);
  
  // Date range
  rows.push([{
    v: dateRange,
    s: {
      font: { sz: 12 },
      alignment: { horizontal: "center" }
    }
  }]);
  
  // Empty row
  rows.push([]);
  
  // Table headers
  const headers = [
    "SER NO", "Bill No", "Date", "NAME OF CUSTOMER", "MOB NO OF CUSTOMER", 
    "ITEMS", "CASE PAYMENT", "ONLINE PAYMENT", "BORROW", "Name of Seller", "REMARKS"
  ];
  
  const headerRow = headers.map(header => ({
    v: header,
    s: {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "FFD700" } }, // Yellow background
      alignment: { horizontal: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    }
  }));
  rows.push(headerRow);
  
  // Data rows
  data.forEach((bill, index) => {
    const billRow = [
      { v: index + 1, s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
      { v: bill.billNumber, s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
      { v: new Date(bill.date).toLocaleDateString("en-IN"), s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
      { v: bill.customerName, s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
      { v: bill.customerMobile || "N/A", s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
      { v: "", s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } }, // Items will be filled below
      { v: bill.cashPayment || 0, s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
      { v: bill.onlinePayment || 0, s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
      { v: bill.borrowedAmount || 0, s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
      { v: bill.sellerName || "N/A", s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } },
      { v: bill.remarks || "N/A", s: { font: { sz: 11 }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } } }
    ];
    
    rows.push(billRow);
    
    // Add items for this bill
    if (bill.items && bill.items.length > 0) {
      bill.items.forEach((item: any) => {
        const itemRow = [
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { 
            v: `${item.productName} (Qty: ${item.quantity}) - Purchase: ${item.purchaseCode} - Sale: ₹${item.salePrice} - Saving: ₹${(item.salePrice - (item.purchasePrice || 0)).toFixed(2)}`, 
            s: { font: { sz: 11 }, border: { left: { style: "thin" }, right: { style: "thin" } } }
          },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } }
        ];
        rows.push(itemRow);
      });
      
      // Add total row for this bill
      const totalPurchase = bill.items.reduce((sum: number, item: any) => sum + (item.purchasePrice || 0), 0);
      const totalSale = bill.items.reduce((sum: number, item: any) => sum + item.salePrice, 0);
      const totalSaving = bill.items.reduce((sum: number, item: any) => sum + (item.salePrice - (item.purchasePrice || 0)), 0);
      
      const totalRow = [
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { 
          v: `Total - Purchase: ₹${totalPurchase.toFixed(2)} - Sale: ₹${totalSale.toFixed(2)} - Saving: ₹${totalSaving.toFixed(2)}`, 
          s: { font: { sz: 11, bold: true }, border: { left: { style: "thin" }, right: { style: "thin" }, bottom: { style: "thin" } } }
        },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } }
      ];
      rows.push(totalRow);
      
      // Empty row between bills
      rows.push([]);
    }
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Merge cells for headers
  const mergeRanges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Company name
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // Title
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }  // Date range
  ];
  worksheet["!merges"] = mergeRanges;
  
  // Set column widths
  const colWidths = [
    { wch: 8 },   // SER NO
    { wch: 10 },  // Bill No
    { wch: 12 },  // Date
    { wch: 20 },  // Customer Name
    { wch: 15 },  // Mobile
    { wch: 60 },  // Items (wider for nested content)
    { wch: 12 },  // Cash Payment
    { wch: 12 },  // Online Payment
    { wch: 10 },  // Borrow
    { wch: 15 },  // Seller Name
    { wch: 20 }   // Remarks
  ];
  worksheet["!cols"] = colWidths;
  
  // Create workbook and save
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Billing Report");
  XLSX.writeFile(workbook, "Billing Report.xlsx");
} 