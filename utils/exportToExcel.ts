
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