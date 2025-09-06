import jsPDF from "jspdf";
import autoTable, { ColumnInput, RowInput } from "jspdf-autotable";

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

/** ------------ 1) BILLING REPORT: same-as-Excel ------------- */
function exportBillingReportPDF(data: any[], dateRange: string) {
  // 1) choose page size dynamically (A4 by default; switch to A3 if too tight)
  let doc = new jsPDF({ orientation: "landscape", format: "a4" });
  let pageWidth = doc.internal.pageSize.getWidth();

  const marginSide = 12;
  let   marginTop  = 48; // ↑ header me totals add kiye, isliye thoda neeche se start
  const marginBottom = 16;

  // ---- headers array (Excel jaisa)
  const headers = [
    "SER NO","Bill No","Date","NAME OF CUSTOMER","MOB NO OF CUSTOMER",
    "ITEMS","CASE PAYMENT","ONLINE PAYMENT","BORROW","Name of Seller","REMARKS"
  ];

  // ---- base widths (approx like Excel). We'll scale these to fit.
  const baseWidths: Record<string, number> = {
    ser: 10, billNo: 16, date: 22, customer: 35, mobile: 26,
    items: 110, cash: 22, online: 24, borrow: 20, seller: 28, remarks: 26
  };
  const minWidths: Record<string, number> = {
    ser: 10, billNo: 14, date: 18, customer: 26, mobile: 20,
    items: 70, cash: 16, online: 16, borrow: 16, seller: 22, remarks: 20
  };

  const totalBase = Object.values(baseWidths).reduce((s, n) => s + n, 0);
  const avail = () => doc.internal.pageSize.getWidth() - marginSide * 2;

  // If A4 too tight (<85% of needed width), switch to A3 before drawing
  if (avail() / totalBase < 0.85) {
    doc = new jsPDF({ orientation: "landscape", format: "a3" });
  }
  pageWidth = doc.internal.pageSize.getWidth();

  const computeWidths = () => {
    const available = avail();
    const scale = Math.min(1, available / totalBase);
    const widths: Record<string, number> = {};
    let sum = 0;
    for (const k of Object.keys(baseWidths)) {
      const w = Math.max(minWidths[k], Math.floor(baseWidths[k] * scale));
      widths[k] = w; sum += w;
    }
    // distribute leftover (give to items column for more text)
    const leftover = available - sum;
    if (leftover > 0) widths.items += leftover;
    return widths;
  };

  const colWidths = computeWidths();

  // ---- GRAND TOTALS (header ke niche dikhayenge)
  const { grandTotalSales, grandTotalProfit } = computeGrandTotals(data);

  // ----------------- HEADER DRAW (repeats each page) -----------------
  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17); // slightly smaller to save space
    doc.setTextColor(8, 61, 166);
    doc.text("SHRI KARISHNA HANDLOOM", pageWidth / 2, 13, { align: "center" });

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text("Billing Report", pageWidth / 2, 21, { align: "center" });

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "normal");
    doc.text((dateRange || "").trim() || "All Time", pageWidth / 2, 28, { align: "center" });

    // NEW: totals on two centered lines
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 160);
    doc.text(`TOTAL SALES: ${fmtINR(grandTotalSales)}`, pageWidth / 2, 35, { align: "center" });

    doc.setTextColor(0, 128, 0);
    doc.text(`TOTAL PROFIT: ${fmtINR(grandTotalProfit)}`, pageWidth / 2, 41, { align: "center" });

    // separator line a little lower now
    doc.setDrawColor(0, 128, 0);
    doc.setLineWidth(0.5);
    doc.line(12, 44, pageWidth - 12, 44);
  };

  // ----------------- BODY BUILD: main → items → total → spacer -----------------
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
      // PDF-safe currency
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
        // Replace ₹ with 'Rs.' so glyph issue is gone
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

  // ----------------- COLUMNS & AUTOTABLE -----------------
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
    // compact typography
    styles: {
      font: "helvetica",
      fontSize: 8,
      lineHeight: 1.05,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      overflow: "linebreak",
      wordBreak: "break-word",
      lineWidth: 0.1,
      lineColor: [180, 180, 180],
      valign: "middle",
    },
    headStyles: {
      fillColor: [255, 215, 0],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center"
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    // auto-fit widths we computed above
    columnStyles: {
      ser:    { cellWidth: colWidths.ser,    halign: "center" },
      billNo: { cellWidth: colWidths.billNo, halign: "center" },
      date:   { cellWidth: colWidths.date,   halign: "center" },
      customer: { cellWidth: colWidths.customer },
      mobile:   { cellWidth: colWidths.mobile, halign: "center" },
      items:    { cellWidth: colWidths.items },
      cash:     { cellWidth: colWidths.cash,   halign: "center" },
      online:   { cellWidth: colWidths.online, halign: "center" },
      // Borrow center aligned
      borrow:   { cellWidth: colWidths.borrow, halign: "center" },
      seller:   { cellWidth: colWidths.seller },
      remarks:  { cellWidth: colWidths.remarks }
    },
    didParseCell: (hook) => {
      if (hook.section === "body") {
        const raw = hook.row.raw as any;
        const key = hook.column.dataKey as string;

        if (raw?._type === "item") {
          if (key !== "items") hook.cell.text = [""];
          else hook.cell.styles.textColor = [70, 70, 70];
        }
        if (raw?._type === "total") {
          if (key !== "items") hook.cell.text = [""];
          else {
            hook.cell.styles.fontStyle = "bold";
            hook.cell.styles.textColor = raw._profitPos ? [0, 128, 0] : [204, 0, 0];
          }
        }
        if (raw?._type === "spacer") {
          hook.cell.text = [""];
          hook.cell.styles.lineWidth = 0;
          hook.row.height = 5;
        }
      }
    },
    didDrawPage: () => drawHeader()
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(110);
    const y = doc.internal.pageSize.getHeight() - 6;
    doc.text(`Page ${i} of ${pages}`, 12, y);
    doc.text(`Printed on ${new Date().toLocaleString("en-IN")}`, doc.internal.pageSize.getWidth() - 12, y, { align: "right" });
  }

  doc.save("Billing Report.pdf");
}


/** ------------ 2) GENERIC TABLE (non-billing) ------------- */
function exportGenericPDF({
  title, dateRange, columns, data, columnLabels, currencyColumns, mergeColumns, orientation, financialSummary
}: any) {
  const doc = new jsPDF({ orientation: orientation || "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginTop = 44;

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(8, 61, 166);
    doc.text("Shree Krishna Handloom", pageWidth / 2, 14, { align: "center" });

    doc.setFontSize(14); doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth / 2, 22, { align: "center" });

    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text((dateRange || "").trim() || "All Time", pageWidth / 2, 30, { align: "center" });

    doc.setDrawColor(200); doc.line(12, 34, pageWidth - 12, 34);
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
    margin: { top: marginTop, left: 12, right: 12, bottom: 16 },
    columns: cols,
    body: rows,
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3, lineWidth: 0.1, lineColor: [200, 200, 200], overflow: "linebreak" },
    headStyles: { fillColor: [8, 61, 166], textColor: 255, fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
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
      headStyles: { fillColor: [8, 61, 166], textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right", textColor: [220, 38, 38], fontStyle: "bold" } },
      didDrawPage: () => drawHeader()
    });
  }

  doc.save(`${title}.pdf`);
}

/** --------------- helpers --------------- */
// PDF-safe Indian currency (₹ glyph ke bajay Rs.)
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

// Grand totals for header
function computeGrandTotals(data: any[]) {
  let grandTotalSales = 0;
  let grandTotalProfit = 0;

  for (const bill of (data || [])) {
    const items = Array.isArray(bill?.items) ? bill.items : [];

    // Prefer bill.totalAmount; fallback: sum of salePrice * qty
    const saleFromItems = items.reduce((s: number, it: any) => {
      const qty  = Number(it?.quantity ?? 1);
      const sale = Number(it?.salePrice ?? 0);
      return s + sale * qty;
    }, 0);
    const totalSale = isNum(bill?.totalAmount) ? Number(bill.totalAmount) : saleFromItems;
    grandTotalSales += totalSale;

    // Profit = (sale - unitCost) * qty
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
