
import * as XLSX from "xlsx-js-style";
import { decodePurchaseCode } from "./function";

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
  console.log("data", data);
  if (title === "Billing Report") {
    console.log("biilling report data", data);
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
      border: thinBorder
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
    s: { font: { sz: 16, bold: true, color: { rgb: "083da6" } }, alignment: { horizontal: "center" } }
  }]);

  // Title
  rows.push([{
    v: "Billing Report",
    s: { font: { sz: 14, bold: true }, alignment: { horizontal: "center" } }
  }]);

  // Date range
  rows.push([{
    v: dateRange,
    s: { font: { sz: 12 }, alignment: { horizontal: "center" } }
  }]);

  // Empty row
  rows.push([]);

  // 👉 calculate totals (correct: qty + decoded cost + fallback)
  let grandTotalSales = 0;
  let grandTotalProfit = 0;

  for (const bill of data as any[]) {
    const items = Array.isArray(bill.items) ? bill.items : [];

    // Prefer bill.totalAmount if available; otherwise compute from items (salePrice * qty)
    const saleFromItems = items.reduce((s: number, it: any) => {
      const qty = Number(it.quantity ?? 1);
      const sale = Number(it.salePrice ?? 0);
      return s + sale * qty;
    }, 0);

    const totalSale = !Number.isNaN(Number(bill.totalAmount)) && bill.totalAmount != null
      ? Number(bill.totalAmount)
      : saleFromItems;

    grandTotalSales += totalSale;

    // Profit = (sale - unitCost) * qty, with decoded purchase price
    const billProfit = items.reduce((s: number, it: any) => {
      const qty = Number(it.quantity ?? 1);
      const sale = Number(it.salePrice ?? 0);
      const decoded = decodePurchaseCode(String(it.purchaseCode ?? ""));
      const unitCost = decoded?.valid ? Number(decoded.value) : Number(it.purchasePrice ?? 0);
      return s + (sale - unitCost) * qty;
    }, 0);

    grandTotalProfit += billProfit;
  }

  // 👉 add summary rows (same placement/formatting)
  rows.push([]);
  rows.push([
    { v: "", s: { alignment: { horizontal: "center" } } }, // SER NO
    { v: "", s: { alignment: { horizontal: "center" } } }, // Bill No
    { v: "", s: { alignment: { horizontal: "center" } } }, // Date
    { v: "TOTAL SALES", s: { font: { sz: 12, bold: true }, alignment: { horizontal: "right" } } },
    { v: `₹${grandTotalSales.toFixed(2)}`, s: { font: { sz: 12, bold: true, color: { rgb: "0000FF" } }, alignment: { horizontal: "center" } } }
  ]);

  rows.push([
    { v: "", s: { alignment: { horizontal: "center" } } }, // SER NO
    { v: "", s: { alignment: { horizontal: "center" } } }, // Bill No
    { v: "", s: { alignment: { horizontal: "center" } } }, // Date
    { v: "TOTAL PROFIT", s: { font: { sz: 12, bold: true }, alignment: { horizontal: "right" } } },
    { v: `₹${grandTotalProfit.toFixed(2)}`, s: { font: { sz: 12, bold: true, color: { rgb: "008000" } }, alignment: { horizontal: "center" } } }
  ]);


  // Table headers
  const headers = [
    "SER NO", "Bill No", "Date", "NAME OF CUSTOMER", "MOB NO OF CUSTOMER",
    "ITEMS", "CASE PAYMENT", "ONLINE PAYMENT", "BORROW", "Name of Seller", "REMARKS"
  ];

  const headerRow = headers.map(header => ({
    v: header,
    s: {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "FFD700" } }, // Yellow
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
      cell(index + 1),
      cell(bill.billNumber),
      cell(new Date(bill.date).toLocaleDateString("en-IN")),
      cell(bill.customer?.name ?? bill.customerName ?? "N/A"),
      cell(bill.customer?.mobile ?? "N/A"),
      cell(""), // items
      cell(bill.cashPayment || 0),
      cell(bill.onlinePayment || 0),
      cell(bill.borrowedAmount || 0),
      cell(bill.sellerName || "N/A"),
      cell(bill.remarks || "N/A")
    ];

    rows.push(billRow);

    // ---- Items for this bill (Profit instead of Saving; uses decoded purchase + qty) ----
    if (bill.items && bill.items.length > 0) {
      bill.items.forEach((item: any) => {
        const purchaseCode = item.purchaseCode || "";
        const decoded = decodePurchaseCode(purchaseCode);
        const unitCost = decoded.valid ? Number(decoded.value) : Number(item.purchasePrice ?? 0);
        const salePrice = Number(item.salePrice || 0);
        const qty = Number(item.quantity || 1);
        const itemProfit = (salePrice - unitCost) * qty;

        const itemText = `${item.product?.name || item.productName} (Qty: ${qty}) - ` +
          `Purchase: ₹${unitCost.toFixed(2)} - Sale: ₹${salePrice.toFixed(2)} - ` +
          `Profit: ₹${itemProfit.toFixed(2)}`;

        rows.push([
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: itemText, s: { font: { sz: 11 }, border: { left: { style: "thin" }, right: { style: "thin" } } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } },
          { v: "", s: { font: { sz: 11 } } }
        ]);
      });

      // ---- Totals row (Purchase*qty, Sale*qty, Profit) ----
      const totals = bill.items.reduce((acc: any, item: any) => {
        const decoded = decodePurchaseCode(item.purchaseCode || "");
        const unitCost = decoded.valid ? Number(decoded.value) : Number(item.purchasePrice ?? 0);
        const salePrice = Number(item.salePrice || 0);
        const qty = Number(item.quantity || 1);

        acc.purchase += unitCost * qty;
        acc.sale += salePrice * qty;
        acc.profit += (salePrice - unitCost) * qty;
        return acc;
      }, { purchase: 0, sale: 0, profit: 0 });

      rows.push([
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        {
          v: `Total - Purchase: ₹${totals.purchase.toFixed(2)} - Sale: ₹${totals.sale.toFixed(2)} - Profit: ₹${totals.profit.toFixed(2)}`,
          s: {
            font: { sz: 11, bold: true, color: { rgb: totals.profit >= 0 ? "008000" : "CC0000" } },
            border: { left: { style: "thin" }, right: { style: "thin" }, bottom: { style: "thin" } }
          }
        },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } },
        { v: "", s: { font: { sz: 11 } } }
      ]);

      // Empty row between bills
      rows.push([]);
    }
  });


  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Merge cells for headers
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Company name
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // Title
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }  // Date range
  ];

  // Set column widths
  worksheet["!cols"] = [
    { wch: 8 },   // SER NO
    { wch: 10 },  // Bill No
    { wch: 12 },  // Date
    { wch: 20 },  // Customer Name
    { wch: 22 },  // Mobile
    { wch: 60 },  // ITEMS (wider, now contains Profit)
    { wch: 15 },  // Cash Payment
    { wch: 15 },  // Online Payment
    { wch: 10 },  // Borrow
    { wch: 15 },  // Seller Name
    { wch: 20 }   // Remarks
  ];

  // Create workbook and save
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Billing Report");
  XLSX.writeFile(workbook, "Billing Report.xlsx");


}

function allThin() {
  return {
    top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" }
  }
}

function cell(value: any, bold = false) {
  return {
    v: value,
    s: {
      font: { sz: 11, bold },
      border: allThin(),
      alignment: { horizontal: "center", vertical: "center" }
    }
  }
}

