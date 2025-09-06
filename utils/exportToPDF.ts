import jsPDF from "jspdf";
import autoTable, { ColumnInput, RowInput } from "jspdf-autotable";

/* ------------------------------- PUBLIC API ------------------------------- */
export function exportToPDF({
  title,
  dateRange,
  columns,
  data,
  columnLabels = [],
  currencyColumns = [],
  mergeColumns = {},
  orientation = "landscape",
  financialSummary
}: {
  title: string;
  dateRange: string;
  columns: string[];
  data: any[];
  columnLabels?: string[];
  currencyColumns?: string[];
  mergeColumns?: Record<string, string[]>;
  orientation?: "portrait" | "landscape";
  financialSummary?: { totalIncome: number; totalExpense: number };
}) {
  const isBilling = title?.toLowerCase().includes("billing");
  if (isBilling) {
    return exportBillingReportPDF(data, dateRange);
  }
  return exportGenericPDF({
    title, dateRange, columns, data, columnLabels, currencyColumns, mergeColumns, orientation, financialSummary
  });
}

/* --------------------------------- THEME --------------------------------- */
// Brand & UI colors (accessible contrast, professional palette)
const C = {
  brand: { dk: [15, 76, 129], base: [26, 95, 180], lt: [232, 241, 250] },
  ink:   { 900: [22, 27, 34], 700: [68, 84, 106], 500: [110, 119, 129] },
  grid:  { line: [200, 208, 218], light: [244, 247, 251] },
  ok:    { base: [9, 132, 87] },
  warn:  { base: [255, 159, 10] },
  err:   { base: [203, 50, 52] },
  info:  { base: [93, 63, 211] },
  gold:  { base: [255, 203, 0] },   // table head like Excel but richer
};

// quick helpers
const setFill = (doc: jsPDF, rgb: number[]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
const setStroke = (doc: jsPDF, rgb: number[]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
const setText = (doc: jsPDF, rgb: number[]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

/* -------------------------- 1) BILLING REPORT PDF ------------------------- */
function exportBillingReportPDF(data: any[], dateRange: string) {
  // choose page size dynamically (A4 by default; switch to A3 if too tight)
  let doc = new jsPDF({ orientation: "landscape", format: "a4" });
  const marginSide = 12;
  let marginTop = 56; // we draw a rich header with chips, so start lower
  const marginBottom = 16;

  // headers
  const headers = [
    "SER NO","Bill No","Date","NAME OF CUSTOMER","MOB NO OF CUSTOMER",
    "ITEMS","CASE PAYMENT","ONLINE PAYMENT","BORROW","Name of Seller","REMARKS"
  ];

  // base widths we’ll auto-scale
  const baseWidths: Record<string, number> = {
    ser: 10, billNo: 16, date: 22, customer: 38, mobile: 28,
    items: 120, cash: 22, online: 24, borrow: 22, seller: 28, remarks: 26
  };
  const minWidths: Record<string, number> = {
    ser: 10, billNo: 14, date: 18, customer: 28, mobile: 20,
    items: 74,  cash: 16, online: 16, borrow: 16, seller: 22, remarks: 18
  };

  const totalBase = Object.values(baseWidths).reduce((s, n) => s + n, 0);
  const avail = () => doc.internal.pageSize.getWidth() - marginSide * 2;

  if (avail() / totalBase < 0.85) {
    doc = new jsPDF({ orientation: "landscape", format: "a3" });
  }

  const pageW = () => doc.internal.pageSize.getWidth();
  const pageH = () => doc.internal.pageSize.getHeight();

  const computeWidths = () => {
    const available = avail();
    const scale = Math.min(1, available / totalBase);
    const widths: Record<string, number> = {};
    let sum = 0;
    for (const k of Object.keys(baseWidths)) {
      const w = Math.max(minWidths[k], Math.floor(baseWidths[k] * scale));
      widths[k] = w; sum += w;
    }
    const leftover = available - sum;
    if (leftover > 0) widths.items += leftover;
    return widths;
  };
  const colWidths = computeWidths();

  // GRAND TOTALS (header chips)
  const { grandTotalSales, grandTotalProfit } = computeGrandTotals(data);

  // ------------------------------ Header Drawer ------------------------------
  const drawHeader = () => {
    // Top brand ribbon
    setFill(doc, C.brand.base);
    doc.rect(0, 0, pageW(), 18, "F");

    // Company name on ribbon
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    setText(doc, [255, 255, 255]);
    doc.text("SHRI KARISHNA HANDLOOM", pageW() / 2, 12, { align: "center" });

    // Title line
    setText(doc, C.ink[900]);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Billing Report", pageW() / 2, 26, { align: "center" });

    // Date range
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    setText(doc, C.ink[700]);
    doc.text((dateRange || "").trim() || "All Time", pageW() / 2, 33, { align: "center" });

    // Two stat “chips” (rounded cards)
    drawChip(doc, {
      x: marginSide, y: 38, w: 85, h: 12,
      fill: [240, 252, 247], stroke: C.ok.base, textColor: C.ok.base,
      label: "TOTAL SALES", value: fmtINR(grandTotalSales)
    });
    drawChip(doc, {
      x: pageW() - marginSide - 85, y: 38, w: 85, h: 12,
      fill: [243, 240, 255], stroke: C.info.base, textColor: C.info.base,
      label: "TOTAL PROFIT", value: fmtINR(grandTotalProfit)
    });

    // subtle divider
    setStroke(doc, C.grid.line); doc.setLineWidth(0.4);
    doc.line(marginSide, 53, pageW() - marginSide, 53);
  };

  // ------------------------- Build Table Body Rows --------------------------
  const body: any[] = [];
  let serial = 1;

  (data || []).forEach((bill: any) => {
    const billItems = Array.isArray(bill?.items) ? bill.items : [];

    body.push({
      _type: "main",
      ser: serial++,
      billNo: bill.billNumber ?? "",
      date: bill.date ? new Date(bill.date).toLocaleDateString("en-IN") : "",
      customer: bill.customer?.name ?? bill.customerName ?? "",
      mobile: bill.customer?.mobile ?? "",
      items: "",
      cash:   isNum(bill.cashPayment)    ? fmtINR(bill.cashPayment)    : "",
      online: isNum(bill.onlinePayment)  ? fmtINR(bill.onlinePayment)  : "",
      borrow: isNum(bill.borrowedAmount) ? fmtINR(bill.borrowedAmount) : "",
      seller: bill.sellerName ?? "",
      remarks: bill.remarks ?? ""
    });

    billItems.forEach((item: any) => {
      const qty = Number(item.quantity ?? 1);
      const sale = Number(item.salePrice ?? 0);
      const decoded = safeDecode(item.purchaseCode);
      const unitCost = decoded.valid ? Number(decoded.value) : Number(item.purchasePrice ?? 0);
      const profit = (sale - unitCost) * qty;

      body.push({
        _type: "item",
        ser: "", billNo: "", date: "", customer: "", mobile: "",
        items:
          `${item.product?.name || item.productName || "Item"} (Qty: ${qty}) - ` +
          `Purchase: ${fmtINR(unitCost)} - Sale: ${fmtINR(sale)} - ` +
          `Profit: ${fmtINR(profit)}`,
        cash: "", online: "", borrow: "", seller: "", remarks: ""
      });
    });

    if (billItems.length > 0) {
      const totals = billItems.reduce((acc: any, it: any) => {
        const qty = Number(it.quantity ?? 1);
        const sale = Number(it.salePrice ?? 0);
        const dec = safeDecode(it.purchaseCode);
        const unit = dec.valid ? Number(dec.value) : Number(it.purchasePrice ?? 0);
        acc.purchase += unit * qty;
        acc.sale += sale * qty;
        acc.profit += (sale - unit) * qty;
        return acc;
      }, { purchase: 0, sale: 0, profit: 0 });

      body.push({
        _type: "total",
        ser: "", billNo: "", date: "", customer: "", mobile: "",
        items:
          `Total - Purchase: ${fmtINR(totals.purchase)} - ` +
          `Sale: ${fmtINR(totals.sale)} - Profit: ${fmtINR(totals.profit)}`,
        cash: "", online: "", borrow: "", seller: "", remarks: "",
        _profitPos: totals.profit >= 0
      });
    }

    body.push({ _type: "spacer", ser: "", billNo: "", date: "", customer: "", mobile: "", items: "", cash: "", online: "", borrow: "", seller: "", remarks: "" });
  });

  // ------------------------------ Render AutoTable --------------------------
  const columns = [
    { header: headers[0], dataKey: "ser" },
    { header: headers[1], dataKey: "billNo" },
    { header: headers[2], dataKey: "date" },
    { header: headers[3], dataKey: "customer" },
    { header: headers[4], dataKey: "mobile" },
    { header: headers[5], dataKey: "items" },
    { header: headers[6], dataKey: "cash" },
    { header: headers[7], dataKey: "online" },
    { header: headers[8], dataKey: "borrow" },
    { header: headers[9], dataKey: "seller" },
    { header: headers[10], dataKey: "remarks" }
  ];

  drawHeader();
  autoTable(doc, {
    startY: marginTop,
    margin: { left: marginSide, right: marginSide, bottom: marginBottom },
    columns: columns as any,
    body: body as any,
    styles: {
      font: "helvetica",
      fontSize: 8.2,
      lineHeight: 1.08,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      overflow: "linebreak",
      wordBreak: "break-word",
      lineWidth: 0.1,
      lineColor: C.grid.line as any,
      valign: "middle",
      textColor: C.ink[900] as any,
    },
    headStyles: {
      fillColor: C.gold.base as any,    // rich golden header
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      lineColor: C.grid.line as any,
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: C.grid.light as any },
    columnStyles: {
      ser:    { cellWidth: colWidths.ser,    halign: "center" },
      billNo: { cellWidth: colWidths.billNo, halign: "center" },
      date:   { cellWidth: colWidths.date,   halign: "center" },
      customer: { cellWidth: colWidths.customer },
      mobile:   { cellWidth: colWidths.mobile, halign: "center" },
      items:    { cellWidth: colWidths.items },
      cash:     { cellWidth: colWidths.cash,   halign: "center" },
      online:   { cellWidth: colWidths.online, halign: "center" },
      borrow:   { cellWidth: colWidths.borrow, halign: "center" }, // centered
      seller:   { cellWidth: colWidths.seller },
      remarks:  { cellWidth: colWidths.remarks }
    },
    didParseCell: (hook) => {
      if (hook.section === "body") {
        const raw = hook.row.raw as any;
        const key = hook.column.dataKey as string;

        if (raw?._type === "item") {
          if (key !== "items") hook.cell.text = [""];
          else hook.cell.styles.textColor = C.ink[700] as any;
        }
        if (raw?._type === "total") {
          if (key !== "items") {
            hook.cell.text = [""];
          } else {
            hook.cell.styles.fontStyle = "bold";
            hook.cell.styles.textColor = (raw._profitPos ? C.ok.base : C.err.base) as any;
          }
        }
        if (raw?._type === "spacer") {
          hook.cell.text = [""];
          hook.cell.styles.lineWidth = 0;
          hook.row.height = 5;
        }
      }
    },
    didDrawPage: () => {
      // sticky-looking header per page
      drawHeader();
      // footer bar
      setStroke(doc, C.grid.line); setText(doc, C.ink[500]);
      const y = pageH() - 8;
      doc.setLineWidth(0.2); doc.line(marginSide, y, pageW() - marginSide, y);
      doc.setFontSize(9);
      doc.text(`Printed on ${new Date().toLocaleString("en-IN")}`, pageW() - marginSide, y + 6, { align: "right" });
    }
  });

  // Page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    setText(doc, C.ink[500]);
    doc.text(`Page ${i} of ${pages}`, marginSide, pageH() - 2);
  }

  doc.save("Billing Report.pdf");
}

/* ------------------------- 2) GENERIC TABLE (others) ------------------------ */
function exportGenericPDF({
  title, dateRange, columns, data, columnLabels, currencyColumns, mergeColumns, orientation, financialSummary
}: any) {
  const doc = new jsPDF({ orientation: orientation || "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginTop = 48;

  const drawHeader = () => {
    // brand bar
    setFill(doc, C.brand.base); doc.rect(0, 0, pageW, 18, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); setText(doc, [255,255,255]);
    doc.text("Shree Krishna Handloom", pageW / 2, 12, { align: "center" });

    setText(doc, C.ink[900]); doc.setFontSize(13);
    doc.text(title, pageW / 2, 26, { align: "center" });

    setText(doc, C.ink[700]); doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
    doc.text((dateRange || "").trim() || "All Time", pageW / 2, 33, { align: "center" });

    setStroke(doc, C.grid.line); doc.setLineWidth(0.4);
    doc.line(12, 40, pageW - 12, 40);
  };

  const labels = (columnLabels?.length ? columnLabels : columns) as string[];
  const cols: ColumnInput[] = labels.map((label, i) => ({ header: label, dataKey: columns[i] }));

  const rows: RowInput[] = (data || []).map((row: any) => {
    const obj: Record<string, any> = {};
    columns.forEach((key: string) => {
      obj[key] = getCellValue(row, key, mergeColumns || {}, currencyColumns || []);
    });
    return obj;
  });

  drawHeader();
  autoTable(doc, {
    startY: marginTop,
    margin: { left: 12, right: 12, bottom: 16 },
    columns: cols,
    body: rows,
    styles: {
      font: "helvetica", fontSize: 9, cellPadding: 3,
      lineWidth: 0.1, lineColor: C.grid.line as any, overflow: "linebreak",
      textColor: C.ink[900] as any
    },
    headStyles: { fillColor: C.brand.base as any, textColor: 255, fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: C.grid.light as any },
    columnStyles: Object.fromEntries((columns as string[]).map(k => [
      k, { halign: (currencyColumns || []).includes(k) ? "right" : "left" }
    ])),
    didDrawPage: () => drawHeader()
  });

  // Optional financial summary
  if (title === "Financial Summary" && financialSummary) {
    const lastY = (doc as any).lastAutoTable.finalY || marginTop;
    autoTable(doc, {
      startY: lastY + 10,
      head: [["Financial Summary", "Value"]],
      body: [
        ["Total Income", fmtINR(financialSummary.totalIncome || 0)],
        ["Total Expense", fmtINR(financialSummary.totalExpense || 0)],
        ["Net Profit", fmtINR((financialSummary.totalIncome || 0) - (financialSummary.totalExpense || 0))],
        ["Profit Margin", (() => {
          const ti = financialSummary.totalIncome || 0;
          const np = (financialSummary.totalIncome || 0) - (financialSummary.totalExpense || 0);
          return ti > 0 ? `${((np / ti) * 100).toFixed(2)}%` : "0%";
        })()],
      ],
      styles: { font: "helvetica", fontSize: 10 },
      headStyles: { fillColor: C.brand.base as any, textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right", textColor: C.err.base as any, fontStyle: "bold" } },
      didDrawPage: () => drawHeader()
    });
  }

  // footer
  setStroke(doc, C.grid.line); setText(doc, C.ink[500]);
  doc.setLineWidth(0.2); doc.line(12, pageH - 8, pageW - 12, pageH - 8);
  doc.setFontSize(9);
  doc.text(`Printed on ${new Date().toLocaleString("en-IN")}`, pageW - 12, pageH - 2, { align: "right" });

  doc.save(`${title}.pdf`);
}

/* --------------------------------- Helpers -------------------------------- */
// Currency in PDF-safe form (₹ glyph can vary across viewers)
const fmtINR = (n: number) =>
  `Rs. ${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const isNum = (v: any) => typeof v === "number" && !Number.isNaN(v);

function safeDecode(purchaseCode: any): { valid: boolean; value: number } {
  if (!purchaseCode) return { valid: false, value: 0 };
  const CODE_MAP: Record<string, string> = { D:"1", I:"2", N:"3", E:"4", S:"5", H:"6", J:"7", A:"8", T:"9", P:"0" };
  try {
    const s = String(purchaseCode).toUpperCase().replace(/\s+/g, "");
    if (!s) return { valid: false, value: 0 };
    let out = ""; for (const ch of s) { if (!(ch in CODE_MAP)) return { valid: false, value: 0 }; out += CODE_MAP[ch]; }
    const num = out.replace(/^0+/, "") || "0";
    return { valid: true, value: Number(num) };
  } catch { return { valid: false, value: 0 }; }
}

function getCellValue(
  row: any,
  col: string,
  mergeColumns: Record<string, string[]>,
  currencyColumns: string[]
): string {
  if (mergeColumns && mergeColumns[col]) {
    return mergeColumns[col]
      .map((field) => {
        let val = row[field];
        if (currencyColumns.includes(field) && typeof val === "number") return fmtINR(val);
        return toStringSafe(val);
      })
      .filter(Boolean)
      .join(" | ");
  }
  const v = row[col];
  if (currencyColumns.includes(col) && typeof v === "number") return fmtINR(v);
  return toStringSafe(v);
}

function toStringSafe(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") { try { return JSON.stringify(v); } catch { return String(v); } }
  return String(v);
}

function computeGrandTotals(data: any[]) {
  let grandTotalSales = 0;
  let grandTotalProfit = 0;

  for (const bill of (data || [])) {
    const items = Array.isArray(bill?.items) ? bill.items : [];

    const saleFromItems = items.reduce((s: number, it: any) => {
      const qty  = Number(it?.quantity ?? 1);
      const sale = Number(it?.salePrice ?? 0);
      return s + sale * qty;
    }, 0);
    const totalSale = isNum(bill?.totalAmount) ? Number(bill.totalAmount) : saleFromItems;
    grandTotalSales += totalSale;

    const billProfit = items.reduce((s: number, it: any) => {
      const qty  = Number(it?.quantity ?? 1);
      const sale = Number(it?.salePrice ?? 0);
      const dec  = safeDecode(String(it?.purchaseCode ?? ""));
      const unit = dec.valid ? Number(dec.value) : Number(it?.purchasePrice ?? 0);
      return s + (sale - unit) * qty;
    }, 0);
    grandTotalProfit += billProfit;
  }

  return { grandTotalSales, grandTotalProfit };
}

// pretty chip card
function drawChip(
  doc: jsPDF,
  opts: { x: number; y: number; w: number; h: number; fill: number[]; stroke: number[]; textColor: number[]; label: string; value: string }
) {
  const { x, y, w, h, fill, stroke, textColor, label, value } = opts;
  setFill(doc, fill); setStroke(doc, stroke);
  doc.setLineWidth(0.5);
  (doc as any).roundedRect(x, y, w, h, 2, 2, "FD");

  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); setText(doc, textColor);
  doc.text(label, x + 4, y + 4.6);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
  doc.text(value, x + w - 4, y + 4.6, { align: "right" });
}
