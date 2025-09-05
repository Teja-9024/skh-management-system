"use client"

import { useState } from "react"
import { useApi } from "@/hooks/use-api"
import { exportToPDF } from "@/utils/exportToPDF"
import { exportToExcel } from "@/utils/exportToExcel"

interface ReportFilters {
  reportType: string
  fromDate: string
  toDate: string
}

interface ReportData {
  bills: any[]
  purchases: any[]
  borrowed: any[]
  expenses: any[]
  summary: {
    totalSales: number
    totalPurchases: number
    totalExpenses: number
    totalBorrowed: number
    totalLent: number
    netOutstanding: number
    grossProfit: number
    netProfit: number
  }
}

export default function ReportsAnalysis() {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: "All Records",
    fromDate: "",
    toDate: "",
  })

  const [showDropdown, setShowDropdown] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [reportData, setReportData] = useState<ReportData>({
    bills: [],
    purchases: [],
    borrowed: [],
    expenses: [],
    summary: {
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalBorrowed: 0,
      totalLent: 0,
      netOutstanding: 0,
      grossProfit: 0,
      netProfit: 0,
    }
  })

  const [loading, setLoading] = useState(false)
  const { execute: fetchData } = useApi()

  const reportTypes = ["All Records", "Billing", "Purchase", "Borrowed", "Expenses"]

  // -------------------------------- HELPERS --------------------------------

  // ✅ EXACT same pagination style as your AllBills page (page + limit + total)
  const fetchAllBillsPaged = async () => {
    const pageLimit = 200
    let page = 1
    let combined: any[] = []
    let total = Infinity

    while (combined.length < total) {
      const qs = new URLSearchParams()
      qs.set("page", String(page))
      qs.set("limit", String(pageLimit))
      if (filters.fromDate) qs.set("fromDate", filters.fromDate)
      if (filters.toDate) qs.set("toDate", filters.toDate)

      const url = `/api/bills?${qs.toString()}`
      const res = await fetchData(url)

      if (page === 1) {
        console.log("REPORT /api/bills first page resp:", res)
      }

      const chunk: any[] = Array.isArray(res?.bills) ? res.bills : []
      const reportedTotal = Number(res?.total ?? 0)

      if (!Number.isNaN(reportedTotal) && reportedTotal > 0) {
        total = reportedTotal
      } else {
        // fallback if API not returning total
        total = combined.length + chunk.length + (chunk.length < pageLimit ? 0 : 1)
      }

      combined = combined.concat(chunk)

      if (chunk.length === 0) break
      if (combined.length >= total) break
      page++
    }

    // normalize + ASC sort by date (oldest first, so early bill numbers show first)
    return (combined || [])
      .map((b) => ({
        ...b,
        billNumber: b.billNumber ?? b.number ?? b.billNo ?? b.id,
        date: b.date ?? b.createdAt ?? b.billDate,
        items: b.items ?? b.billItems ?? [],
        totalAmount: b.totalAmount ?? b.amount ?? 0,
        cashPayment: b.cashPayment ?? 0,
        onlinePayment: b.onlinePayment ?? 0,
      }))
      .sort((a: any, b: any) => (new Date(a?.date || 0).getTime()) - (new Date(b?.date || 0).getTime()))
  }

  // Single-shot fetch for other endpoints (add paged variants if your APIs paginate)
  const fetchAllSimple = async (
    endpoint: "/api/purchases" | "/api/expenses" | "/api/money-transactions",
    rootKey: "purchases" | "expenses" | "transactions"
  ) => {
    const qs = new URLSearchParams()
    if (filters.fromDate) qs.set("fromDate", filters.fromDate)
    if (filters.toDate) qs.set("toDate", filters.toDate)
    const url = qs.toString() ? `${endpoint}?${qs.toString()}` : endpoint
    const res = await fetchData(url)
    return Array.isArray(res?.[rootKey]) ? res[rootKey] : (res?.data || [])
  }

  const normalizePurchases = (rows: any[]) =>
    (rows || []).map((p) => ({
      ...p,
      purchaseDate: p.purchaseDate ?? p.date ?? p.createdAt,
      totalValue: p.totalValue ?? p.amount ?? 0,
      productName: p.productName ?? p.product?.name,
      supplierName: p.supplierName ?? p.supplier?.name,
      stockStatus: p.stockStatus ?? "AVAILABLE",
      quantity: p.quantity ?? 0,
      purchasePrice: p.purchasePrice ?? 0,
    }))

  const normalizeMoneyTx = (rows: any[]) =>
    (rows || []).map((t) => ({
      ...t,
      date: t.date ?? t.createdAt,
      status: t.status ?? "Active",
    }))

  const normalizeExpenses = (rows: any[]) =>
    (rows || []).map((e) => ({
      ...e,
      date: e.date ?? e.createdAt,
      amount: e.amount ?? 0,
    }))

  // -------------------------------- GENERATE --------------------------------

  const generateReport = async () => {
    if (!filters.reportType) {
      alert("Please select a report type")
      return
    }

    setLoading(true)
    try {
      let allData: ReportData = {
        bills: [],
        purchases: [],
        borrowed: [],
        expenses: [],
        summary: {
          totalSales: 0,
          totalPurchases: 0,
          totalExpenses: 0,
          totalBorrowed: 0,
          totalLent: 0,
          netOutstanding: 0,
          grossProfit: 0,
          netProfit: 0,
        }
      }

      // Billing — paginated ✅
      if (filters.reportType === "All Records" || filters.reportType === "Billing") {
        const rawBills = await fetchAllBillsPaged()
        console.log("REPORT bills length:", rawBills.length)
        allData.bills = rawBills
      }

      // Purchase
      if (filters.reportType === "All Records" || filters.reportType === "Purchase") {
        const raw = await fetchAllSimple("/api/purchases", "purchases")
        allData.purchases = normalizePurchases(raw)
      }

      // Borrowed / Lent
      if (filters.reportType === "All Records" || filters.reportType === "Borrowed") {
        const raw = await fetchAllSimple("/api/money-transactions", "transactions")
        allData.borrowed = normalizeMoneyTx(raw)
      }

      // Expenses
      if (filters.reportType === "All Records" || filters.reportType === "Expenses") {
        const raw = await fetchAllSimple("/api/expenses", "expenses")
        allData.expenses = normalizeExpenses(raw)
      }

      // ---- Summary (COGS via purchaseCode) ----
      const totalSales = allData.bills.reduce((sum, bill: any) => sum + (bill.totalAmount || 0), 0)
      const totalPurchases = allData.purchases.reduce((sum, p: any) => sum + (p.totalValue || 0), 0)
      const totalExpenses = allData.expenses.reduce((sum, e: any) => sum + (e.amount || 0), 0)

      const borrowedTransactions = allData.borrowed.filter((t: any) => t.transactionType === "BORROWED")
      const lentTransactions     = allData.borrowed.filter((t: any) => t.transactionType === "LENT")
      const totalBorrowed = borrowedTransactions.reduce((s: number, t: any) => s + (t.amount || 0), 0)
      const totalLent     = lentTransactions.reduce((s: number, t: any) => s + (t.amount || 0), 0)
      const netOutstanding = totalBorrowed - totalLent

      const cogsFromBills = allData.bills.reduce((billSum: number, bill: any) => {
        const items = bill.items || []
        const cogsForBill = items.reduce((itemSum: number, it: any) => {
          const quantity = Number(it.quantity || 0)
          const decoded = decodePurchaseCode(String(it.purchaseCode || ""))
          const unitCost = decoded.valid ? Number(decoded.value) : 0
          return itemSum + unitCost * quantity
        }, 0)
        return billSum + cogsForBill
      }, 0)

      const grossProfit = totalSales - cogsFromBills
      const netProfit   = grossProfit - totalExpenses

      allData.summary = {
        totalSales,
        totalPurchases,
        totalExpenses,
        totalBorrowed,
        totalLent,
        netOutstanding,
        grossProfit,
        netProfit,
      }

      setReportData(allData)
      setReportGenerated(true)
      alert(`${filters.reportType} generated successfully!`)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    switch (filters.reportType) {
      case "Billing":
        return reportData.bills
      case "Purchase":
        return reportData.purchases
      case "Borrowed":
        return reportData.borrowed
      case "Expenses":
        return reportData.expenses
      default:
        return [...reportData.bills, ...reportData.purchases, ...reportData.borrowed, ...reportData.expenses]
    }
  }

  // ------------------------------ UI: TABLES ------------------------------

  const renderBillingTable = () => {
    const data = reportData.bills
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-medium mb-2">No Billing Data Found</div>
          <div className="text-sm">No billing records found for the selected period.</div>
        </div>
      )
    }

    return (
      <div className="w-full">
        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {data.map((bill: any, index: number) => {
            const billItems = bill.items || []
            const totalProfit = billItems.reduce((sum: number, item: any) => {
              const purchaseCode = item.purchaseCode || ""
              const decoded = decodePurchaseCode(purchaseCode)
              const purchasePrice = decoded.valid ? decoded.value : 0
              const salePrice = item.salePrice || 0
              const quantity = item.quantity || 1
              const itemProfit = (salePrice - purchasePrice) * quantity
              return sum + itemProfit
            }, 0)

            const dateStr = bill.date || bill.createdAt
            return (
              <div key={bill.id || index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="text-lg font-bold text-blue-600">#{bill.billNumber ?? (index + 1)}</div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    ✅ Completed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="font-medium text-gray-500">Date</div>
                    <div className="font-semibold">
                      {dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "—"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Total Amount</div>
                    <div className="text-lg font-bold text-green-600">₹{(bill.totalAmount || 0).toLocaleString("en-IN")}</div>
                  </div>
                </div>

                <div>
                  <div className="font-medium text-gray-500 mb-1">Customer</div>
                  <div className="font-semibold text-gray-800">{bill.customer?.name || bill.customerName || "N/A"}</div>
                  {bill.customer?.mobile && (
                    <div className="text-sm text-blue-600">📱 {bill.customer.mobile}</div>
                  )}
                  {bill.sellerName && (
                    <div className="text-sm text-gray-600">Seller: {bill.sellerName}</div>
                  )}
                </div>

                <div>
                  <div className="font-medium text-gray-500 mb-1">Items & Profit</div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    📦 {(bill.items || []).length} items
                  </span>
                  {(bill.items || []).slice(0, 2).map((item: any, idx: number) => {
                    const purchaseCode = item.purchaseCode || ""
                    const decoded = decodePurchaseCode(purchaseCode)
                    const purchasePrice = decoded.valid ? decoded.value : 0
                    const salePrice = item.salePrice || 0
                    const quantity = item.quantity || 1
                    const itemProfit = (salePrice - purchasePrice) * quantity

                    return (
                      <div key={idx} className="text-sm text-gray-600 mt-1 border-l-2 border-gray-200 pl-2">
                        <div>• {item.productName || item.product?.name} (Qty: {item.quantity})</div>
                        <div className="text-xs text-gray-500">
                          Sale: ₹{salePrice.toFixed(2)} | Purchase: ₹{purchasePrice.toFixed(2)} |{" "}
                          <span className={`font-bold ${itemProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Profit: ₹{itemProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {(bill.items || []).length > 2 && (
                    <div className="text-sm text-gray-500 mt-1">+{(bill.items || []).length - 2} more items</div>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-700 mb-1">Total Profit Summary</div>
                  <div className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{totalProfit.toFixed(2)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block w-full overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Bill #</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Customer Details</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Items</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Sale Price</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Purchase Price</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Profit</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Total Amount</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((bill: any, index: number) => {
                const billItems = bill.items || []
                const totalProfit = billItems.reduce((sum: number, item: any) => {
                  const purchaseCode = item.purchaseCode || ""
                  const decoded = decodePurchaseCode(purchaseCode)
                  const purchasePrice = decoded.valid ? decoded.value : 0
                  const salePrice = item.salePrice || 0
                  const quantity = item.quantity || 1
                  const itemProfit = (salePrice - purchasePrice) * quantity
                  return sum + itemProfit
                }, 0)

                const dateStr = bill.date || bill.createdAt
                return (
                  <tr key={bill.id || index} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-4 py-4 text-sm font-bold text-blue-600 border-r border-gray-100">#{bill.billNumber ?? (index + 1)}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                      <div className="font-medium">{dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "—"}</div>
                      <div className="text-xs text-gray-500">{dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                      <div className="font-semibold text-gray-800">{bill.customer?.name || bill.customerName || "N/A"}</div>
                      {bill.customer?.mobile && (<div className="text-xs text-blue-600 font-medium">📱 {bill.customer.mobile}</div>)}
                      {bill.sellerName && (<div className="text-xs text-gray-500">Seller: {bill.sellerName}</div>)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">📦 {(bill.items || []).length} items</span>
                      </div>
                      {(bill.items || []).slice(0, 2).map((item: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 mt-1">• {item.productName || item.product?.name} (Qty: {item.quantity})</div>
                      ))}
                      {(bill.items || []).length > 2 && (<div className="text-xs text-gray-500 mt-1">+{(bill.items || []).length - 2} more items</div>)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                      <div className="text-sm font-medium">
                        {billItems.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs">₹{(item.salePrice || 0).toFixed(2)} × {item.quantity || 1}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                      <div className="text-sm font-medium">
                        {billItems.map((item: any, idx: number) => {
                          const purchaseCode = item.purchaseCode || ""
                          const decoded = decodePurchaseCode(purchaseCode)
                          const purchasePrice = decoded.valid ? decoded.value : 0
                          return (<div key={idx} className="text-xs">₹{purchasePrice.toFixed(2)} × {item.quantity || 1}</div>)
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm border-r border-gray-100">
                      <div className="text-sm font-medium">
                        {billItems.map((item: any, idx: number) => {
                          const purchaseCode = item.purchaseCode || ""
                          const decoded = decodePurchaseCode(purchaseCode)
                          const purchasePrice = decoded.valid ? decoded.value : 0
                          const salePrice = item.salePrice || 0
                          const quantity = item.quantity || 1
                          const itemProfit = (salePrice - purchasePrice) * quantity
                          return (
                            <div key={idx} className={`text-xs font-bold ${itemProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{itemProfit.toFixed(2)}
                            </div>
                          )
                        })}
                      </div>
                      <div className={`text-sm font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Total: ₹{totalProfit.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-green-600 border-r border-gray-100">
                      <div className="text-lg">₹{(bill.totalAmount || 0).toLocaleString("en-IN")}</div>
                      {bill.cashPayment > 0 && (<div className="text-xs text-gray-500">Cash: ₹{bill.cashPayment.toLocaleString("en-IN")}</div>)}
                      {bill.onlinePayment > 0 && (<div className="text-xs text-gray-500">Online: ₹{bill.onlinePayment.toLocaleString("en-IN")}</div>)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">✅ Completed</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderPurchaseTable = () => {
    const data = reportData.purchases
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-medium mb-2">No Purchase Data Found</div>
          <div className="text-sm">No purchase records found for the selected period.</div>
        </div>
      )
    }

    return (
      <div className="w-full">
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-4">
          {data.map((purchase: any, index: number) => (
            <div key={purchase.id || index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="text-lg font-bold text-blue-600">#{index + 1}</div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    purchase.stockStatus === "AVAILABLE"
                      ? "bg-green-100 text-green-800"
                      : purchase.stockStatus === "LOW_STOCK"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {purchase.stockStatus === "AVAILABLE"
                    ? "✅ Available"
                    : purchase.stockStatus === "LOW_STOCK"
                      ? "⚠️ Low Stock"
                      : "❌ Out of Stock"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Date</div>
                  <div className="font-semibold">
                    {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString("en-IN") : "—"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Total Value</div>
                  <div className="text-lg font-bold text-blue-600">
                    ₹{(purchase.totalValue || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-500 mb-1">Product</div>
                <div className="font-semibold text-gray-800">{purchase.product?.name || purchase.productName || "N/A"}</div>
                {purchase.remarks && <div className="text-sm text-gray-600">💬 {purchase.remarks}</div>}
              </div>

              <div>
                <div className="font-medium text-gray-500 mb-1">Supplier</div>
                <div className="font-semibold text-gray-800">{purchase.supplier?.name || purchase.supplierName || "N/A"}</div>
                {purchase.paymentType && (
                  <div className="text-sm text-blue-600">💳 {String(purchase.paymentType).replace('_', ' ')}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Quantity</div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    📦 {purchase.quantity || 0}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Unit Price</div>
                  <div className="font-semibold">₹{(purchase.purchasePrice || 0).toLocaleString("en-IN")}</div>
                </div>
              </div>

              {purchase.borrowedAmount > 0 && (
                <div>
                  <div className="font-medium text-gray-500">Borrowed Amount</div>
                  <div className="text-sm font-semibold text-orange-600">
                    💰 ₹{purchase.borrowedAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block w-full overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Purchase Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Product Details</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Supplier Info</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Quantity & Price</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Total Value</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Stock Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((purchase: any, index: number) => (
                <tr key={purchase.id || index} className="hover:bg-green-50 transition-colors duration-150">
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <div className="font-medium">{purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString("en-IN") : "—"}</div>
                    <div className="text-xs text-gray-500">{purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <div className="font-semibold text-gray-800">{purchase.product?.name || purchase.productName || "N/A"}</div>
                    {purchase.remarks && (<div className="text-xs text-gray-600 mt-1">💬 {purchase.remarks}</div>)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <div className="font-medium text-gray-800">{purchase.supplier?.name || purchase.supplierName || "N/A"}</div>
                    {purchase.paymentType && (<div className="text-xs text-blue-600 font-medium">💳 {String(purchase.paymentType).replace('_', ' ')}</div>)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        📦 {purchase.quantity || 0}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Unit: ₹{(purchase.purchasePrice || 0).toLocaleString("en-IN")}</div>
                  </td>
                    <td className="px-4 py-4 text-sm font-bold text-blue-600 border-r border-gray-100">
                      <div className="text-lg">₹{(purchase.totalValue || 0).toLocaleString("en-IN")}</div>
                      {purchase.borrowedAmount > 0 && (<div className="text-xs text-orange-600">💰 Borrowed: ₹{purchase.borrowedAmount.toLocaleString("en-IN")}</div>)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        purchase.stockStatus === "AVAILABLE"
                          ? "bg-green-100 text-green-800"
                          : purchase.stockStatus === "LOW_STOCK"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {purchase.stockStatus === "AVAILABLE" ? "✅ Available" :
                         purchase.stockStatus === "LOW_STOCK" ? "⚠️ Low Stock" : "❌ Out of Stock"}
                      </span>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderBorrowedTable = () => {
    const data = reportData.borrowed
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-medium mb-2">No Money Transaction Data Found</div>
          <div className="text-sm">No money transactions found for the selected period.</div>
        </div>
      )
    }

    return (
      <div className="w-full">
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-4">
          {data.map((transaction: any, index: number) => (
            <div key={transaction.id || index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="text-lg font-bold text-blue-600">#{index + 1}</div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  transaction.transactionType === "BORROWED"
                    ? "bg-red-100 text-red-800"
                    : transaction.transactionType === "LENT"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                }`}>
                  {transaction.transactionType === "BORROWED" ? "📥 Borrowed" : 
                   transaction.transactionType === "LENT" ? "📤 Lent" : "🔄 Repayment"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Date</div>
                  <div className="font-semibold">
                    {transaction.date ? new Date(transaction.date).toLocaleDateString("en-IN") : "—"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {transaction.date ? new Date(transaction.date).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Amount</div>
                  <div className="text-lg font-bold text-gray-900">₹{(transaction.amount || 0).toLocaleString("en-IN")}</div>
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-500 mb-1">Person</div>
                <div className="font-semibold text-gray-800">{transaction.personName || "N/A"}</div>
                {transaction.contactInfo && (<div className="text-sm text-blue-600">📞 {transaction.contactInfo}</div>)}
                <div className="text-sm text-gray-600">{transaction.destination}</div>
              </div>

              <div>
                <div className="font-medium text-gray-500 mb-1">Purpose</div>
                <div className="font-semibold text-gray-800">{transaction.primaryPurpose || "N/A"}</div>
                {transaction.interestRate > 0 && (
                  <div className="text-sm text-gray-600">💹 {transaction.interestRate}% {transaction.interestType}</div>
                )}
                {transaction.expectedReturnDate && (
                  <div className="text-sm text-gray-500">📅 Return: {new Date(transaction.expectedReturnDate).toLocaleDateString("en-IN")}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Payment Method</div>
                  <div className="font-semibold">💳 {transaction.paymentMethod || "N/A"}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Status</div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    transaction.status === "Active/Outstanding" || transaction.status === "Active"
                      ? "bg-yellow-100 text-yellow-800"
                      : transaction.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}>
                    {transaction.status === "Active/Outstanding" || transaction.status === "Active" ? "⏳ Active" :
                     transaction.status === "Completed" ? "✅ Completed" : "❌ " + (transaction.status || "Active")}
                  </span>
                </div>
              </div>

              {transaction.interestRate > 0 && (
                <div>
                  <div className="font-medium text-gray-500">Interest Amount</div>
                  <div className="text-sm font-semibold text-gray-600">
                    ₹{((transaction.amount || 0) * (transaction.interestRate || 0) / 100).toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block w-full overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Transaction Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Type</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Person Details</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Purpose & Terms</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Amount</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Payment & Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((transaction: any, index: number) => (
                <tr key={transaction.id || index} className="hover:bg-purple-50 transition-colors duration-150">
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <div className="font-medium">{transaction.date ? new Date(transaction.date).toLocaleDateString("en-IN") : "—"}</div>
                    <div className="text-xs text-gray-500">{transaction.date ? new Date(transaction.date).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}</div>
                  </td>
                  <td className="px-4 py-4 text-sm border-r border-gray-100">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      transaction.transactionType === "BORROWED"
                        ? "bg-red-100 text-red-800"
                        : transaction.transactionType === "LENT"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {transaction.transactionType === "BORROWED" ? "📥 Borrowed" :
                       transaction.transactionType === "LENT" ? "📤 Lent" : "🔄 Repayment"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <div className="font-semibold text-gray-800">{transaction.personName || "N/A"}</div>
                    {transaction.contactInfo && (<div className="text-xs text-blue-600 font-medium">📞 {transaction.contactInfo}</div>)}
                    <div className="text-xs text-gray-500">{transaction.destination}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <div className="font-medium text-gray-800">{transaction.primaryPurpose || "N/A"}</div>
                    {transaction.interestRate > 0 && (<div className="text-xs text-gray-600 mt-1">💹 {transaction.interestRate}% {transaction.interestType}</div>)}
                    {transaction.expectedReturnDate && (<div className="text-xs text-gray-500 mt-1">📅 Return: {new Date(transaction.expectedReturnDate).toLocaleDateString("en-IN")}</div>)}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-gray-900 border-r border-gray-100">
                    <div className="text-lg">₹{(transaction.amount || 0).toLocaleString("en-IN")}</div>
                    {transaction.interestRate > 0 && (<div className="text-xs text-gray-500">Interest: ₹{((transaction.amount || 0) * (transaction.interestRate || 0) / 100).toLocaleString("en-IN")}</div>)}
                  </td>
                  <td className="px-4 py-4 text-sm border-r border-gray-100">
                    <div className="mb-2"><span className="text-xs text-gray-600 font-medium">💳 {transaction.paymentMethod || "N/A"}</span></div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      transaction.status === "Active/Outstanding" || transaction.status === "Active"
                        ? "bg-yellow-100 text-yellow-800"
                        : transaction.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }`}>
                      {transaction.status === "Active/Outstanding" || transaction.status === "Active" ? "⏳ Active" :
                       transaction.status === "Completed" ? "✅ Completed" : "❌ " + (transaction.status || "Active")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderExpensesTable = () => {
    const data = reportData.expenses
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-medium mb-2">No Expense Data Found</div>
          <div className="text-sm">No expense records found for the selected period.</div>
        </div>
      )
    }

    return (
      <div className="w-full">
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-4">
          {data.map((expense: any, index: number) => (
            <div key={expense.id || index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="text-lg font-bold text-red-600">#{index + 1}</div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                  🏷️ {(expense.expenseCategory || "").replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Date</div>
                  <div className="font-semibold">{expense.date ? new Date(expense.date).toLocaleDateString("en-IN") : "—"}</div>
                  <div className="text-xs text-gray-400">{expense.date ? new Date(expense.date).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Amount</div>
                  <div className="text-lg font-bold text-red-600">₹{(expense.amount || 0).toLocaleString("en-IN")}</div>
                </div>
              </div>

              <div>
                <div className="font-medium text-gray-500 mb-1">Expense Type</div>
                <div className="font-semibold text-gray-800">{expense.expenseType}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Category</div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    🏷️ {(expense.expenseCategory || "").replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Payment Method</div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                    💳 {(expense.paymentType || "").replace('_', ' ')}
                  </span>
                </div>
              </div>

              {expense.remarks && (
                <div>
                  <div className="font-medium text-gray-500 mb-1">Remarks</div>
                  <div className="text-sm text-gray-700">
                    <span className="text-xs text-gray-500">💬</span> {expense.remarks}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block w-full overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-red-50 to-pink-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Expense Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Expense Details</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Category</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Amount</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Payment Method</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((expense: any, index: number) => (
                <tr key={expense.id || index} className="hover:bg-red-50 transition-colors duration-150">
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <div className="font-medium">{expense.date ? new Date(expense.date).toLocaleDateString("en-IN") : "—"}</div>
                    <div className="text-xs text-gray-500">{expense.date ? new Date(expense.date).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <div className="font-semibold text-gray-800">{expense.expenseType}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                      🏷️ {(expense.expenseCategory || "").replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-red-600 border-r border-gray-100">
                    <div className="text-lg">₹{(expense.amount || 0).toLocaleString("en-IN")}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                      💳 {(expense.paymentType || "").replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {expense.remarks ? (
                        <div className="text-gray-700"><span className="text-xs text-gray-500">💬</span> {expense.remarks}</div>
                      ) : (<span className="text-gray-400 text-xs">No remarks</span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderAllRecordsTable = () => {
    const data = getFilteredData()
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-medium mb-2">No Data Found</div>
          <div className="text-sm">No business records found for the selected period.</div>
        </div>
      )
    }

    return (
      <div className="w-full">
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-4">
          {data.map((item: any, index: number) => {
            const isBill = item.totalAmount !== undefined && (item.items || item.customer || item.billNumber !== undefined)
            const isPurchase = item.totalValue !== undefined
            const isExpense = item.amount !== undefined && item.expenseType
            const isBorrowed = item.transactionType === "BORROWED"
            const isLent = item.transactionType === "LENT"
            const dateStr = item.date || item.purchaseDate || item.createdAt

            return (
              <div key={item.id || index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="text-lg font-bold text-blue-600">#{index + 1}</div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    isBill ? "bg-green-100 text-green-800" :
                    isPurchase ? "bg-blue-100 text-blue-800" :
                    isExpense ? "bg-red-100 text-red-800" :
                    isBorrowed ? "bg-orange-100 text-orange-800" :
                    isLent ? "bg-purple-100 text-purple-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {isBill ? "🧾 Sale" :
                     isPurchase ? "🛒 Purchase" :
                     isExpense ? "💸 Expense" :
                     isBorrowed ? "📥 Borrowed" :
                     isLent ? "📤 Lent" : "📋 Other"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="font-medium text-gray-500">Date</div>
                    <div className="font-semibold">{dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "—"}</div>
                    <div className="text-xs text-gray-400">{dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Amount</div>
                    <div className="text-lg font-bold text-gray-900">₹{(item.totalAmount || item.totalValue || item.amount || 0).toLocaleString("en-IN")}</div>
                  </div>
                </div>

                <div>
                  <div className="font-medium text-gray-500 mb-1">Description</div>
                  <div className="font-semibold text-gray-800">
                    {item.customer?.name || item.product?.name || item.expenseType || item.personName || "N/A"}
                  </div>
                  {item.customer?.mobile && (<div className="text-sm text-blue-600">📱 {item.customer.mobile}</div>)}
                  {item.supplier?.name && (<div className="text-sm text-gray-600">🏪 {item.supplier.name}</div>)}
                </div>

                <div>
                  <div className="font-medium text-gray-500 mb-1">Category</div>
                  <div className="text-gray-700">{item.expenseCategory?.replace('_', ' ') || item.primaryPurpose || "N/A"}</div>
                </div>

                <div>
                  <div className="font-medium text-gray-500 mb-1">Status</div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    isBill ? "bg-green-100 text-green-800" :
                    isPurchase ? "bg-blue-100 text-blue-800" :
                    isExpense ? "bg-red-100 text-red-800" :
                    isBorrowed ? "bg-yellow-100 text-yellow-800" :
                    isLent ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {isBill ? "✅ Completed" :
                     isPurchase ? "📦 Received" :
                     isExpense ? "💳 Paid" :
                     isBorrowed ? "⏳ Active" :
                     isLent ? "⏳ Active" : "📋 N/A"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block w-full overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Transaction Type</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Description</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Amount</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Category</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item: any, index: number) => {
                const isBill = item.totalAmount !== undefined && (item.items || item.customer || item.billNumber !== undefined)
                const isPurchase = item.totalValue !== undefined
                const isExpense = item.amount !== undefined && item.expenseType
                const isBorrowed = item.transactionType === "BORROWED"
                const isLent = item.transactionType === "LENT"
                const dateStr = item.date || item.purchaseDate || item.createdAt

                return (
                  <tr key={item.id || index} className="hover:bg-indigo-50 transition-colors duration-150">
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                      <div className="font-medium">{dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "—"}</div>
                      <div className="text-xs text-gray-500">{dateStr ? new Date(dateStr).toLocaleDateString("en-IN", { weekday: 'short' }) : ""}</div>
                    </td>
                    <td className="px-4 py-4 text-sm border-r border-gray-100">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        isBill ? "bg-green-100 text-green-800" :
                        isPurchase ? "bg-blue-100 text-blue-800" :
                        isExpense ? "bg-red-100 text-red-800" :
                        isBorrowed ? "bg-orange-100 text-orange-800" :
                        isLent ? "bg-purple-100 text-purple-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        { isBill ? "🧾 Sale" :
                          isPurchase ? "🛒 Purchase" :
                          isExpense ? "💸 Expense" :
                          isBorrowed ? "📥 Borrowed" :
                          isLent ? "📤 Lent" : "📋 Other" }
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                      <div className="font-semibold text-gray-800">
                        {item.customer?.name || item.product?.name || item.expenseType || item.personName || "N/A"}
                      </div>
                      {item.customer?.mobile && (<div className="text-xs text-blue-600 font-medium">📱 {item.customer.mobile}</div>)}
                      {item.supplier?.name && (<div className="text-xs text-gray-600">🏪 {item.supplier.name}</div>)}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-900 border-r border-gray-100">
                      <div className="text-lg">₹{(item.totalAmount || item.totalValue || item.amount || 0).toLocaleString("en-IN")}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-100">
                      <div className="text-gray-700">{item.expenseCategory?.replace('_', ' ') || item.primaryPurpose || "N/A"}</div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        isBill ? "bg-green-100 text-green-800" :
                        isPurchase ? "bg-blue-100 text-blue-800" :
                        isExpense ? "bg-red-100 text-red-800" :
                        isBorrowed ? "bg-yellow-100 text-yellow-800" :
                        isLent ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {isBill ? "✅ Completed" :
                         isPurchase ? "📦 Received" :
                         isExpense ? "💳 Paid" :
                         isBorrowed || isLent ? "⏳ Active" : "📋 N/A"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderDataTable = () => {
    switch (filters.reportType) {
      case "Billing":  return renderBillingTable()
      case "Purchase": return renderPurchaseTable()
      case "Borrowed": return renderBorrowedTable()
      case "Expenses": return renderExpensesTable()
      default:         return renderAllRecordsTable()
    }
  }

  // -------------------------------- RENDER --------------------------------

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Reports & Analysis</h2>
        <p className="text-gray-600">Generate detailed reports with filters</p>
      </div>

      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <div className="relative">
              <button
                type="button"
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus text-left bg-white flex items-center justify-between"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span>{filters.reportType}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {reportTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, reportType: type }))
                        setShowDropdown(false)
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
              value={filters.fromDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
              placeholder="dd-mm-yyyy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
              value={filters.toDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
              placeholder="dd-mm-yyyy"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Report Results */}
      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
        {!reportGenerated ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Select filters and click "Generate Report" to view results</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
              <h3 className="text-lg font-semibold mb-4 sm:mb-0">{filters.reportType} Results</h3>

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const data = getFilteredData()
                    const columns = getColumnsForReport()
                    const columnLabels = getColumnLabelsForReport()
                    const currencyColumns = getCurrencyColumnsForReport()

                    exportToPDF({
                      title: `${filters.reportType} Report`,
                      dateRange: `${filters.fromDate ? `From: ${filters.fromDate}` : ''} ${filters.toDate ? `To: ${filters.toDate}` : ''}`.trim() || 'All Time',
                      columns,
                      data,
                      columnLabels,
                      currencyColumns,
                      orientation: 'landscape'
                    })
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  📄 Download PDF
                </button>
                <button
                  onClick={() => {
                    const data = getFilteredData()
                    const columns = getColumnsForReport()
                    const columnLabels = getColumnLabelsForReport()
                    const currencyColumns = getCurrencyColumnsForReport()

                    exportToExcel({
                      title: `${filters.reportType} Report`,
                      dateRange: `${filters.fromDate ? `From: ${filters.fromDate}` : ''} ${filters.toDate ? `To: ${filters.toDate}` : ''}`.trim() || 'All Time',
                      columns,
                      data,
                      columnLabels,
                      currencyColumns
                    })
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  📊 Download Excel
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-gray-800 text-sm">Total Sales</h4>
                <p className="text-xl sm:text-2xl font-bold text-green-600">₹{reportData.summary.totalSales.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-800 text-sm">Total Purchases</h4>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">₹{reportData.summary.totalPurchases.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-gray-800 text-sm">Total Expenses</h4>
                <p className="text-xl sm:text-2xl font-bold text-red-600">₹{reportData.summary.totalExpenses.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-800 text-sm">Net Profit</h4>
                <p className={`text-xl sm:text-2xl font-bold ${reportData.summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{reportData.summary.netProfit.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Additional Summary for All Records */}
            {filters.reportType === "All Records" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-gray-800 text-sm">Total Borrowed</h4>
                  <p className="text-xl font-bold text-orange-600">₹{reportData.summary.totalBorrowed.toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-gray-800 text-sm">Total Lent</h4>
                  <p className="text-xl font-bold text-blue-600">₹{reportData.summary.totalLent.toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
                  <h4 className="font-semibold text-gray-800 text-sm">Net Outstanding</h4>
                  <p className={`text-xl font-bold ${reportData.summary.netOutstanding >= 0 ? "text-orange-600" : "text-green-600"}`}>
                    ₹{Math.abs(reportData.summary.netOutstanding).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className="mt-6">
              {renderDataTable()}
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ------------------- EXPORT HELPERS -------------------
  function getColumnsForReport(): string[] {
    switch (filters.reportType) {
      case "Billing":  return ["billNumber", "date", "customerName", "items", "totalAmount", "status"]
      case "Purchase": return ["purchaseDate", "productName", "supplierName", "quantity", "totalValue", "stockStatus"]
      case "Borrowed": return ["date", "transactionType", "personName", "primaryPurpose", "amount", "status"]
      case "Expenses": return ["date", "expenseType", "expenseCategory", "amount", "paymentType", "remarks"]
      default:         return ["date", "type", "description", "amount", "category", "status"]
    }
  }
  function getColumnLabelsForReport(): string[] {
    switch (filters.reportType) {
      case "Billing":  return ["Bill #", "Date", "Customer", "Items", "Total Amount", "Status"]
      case "Purchase": return ["Purchase Date", "Product", "Supplier", "Quantity", "Total Value", "Stock Status"]
      case "Borrowed": return ["Date", "Type", "Person", "Purpose", "Amount", "Status"]
      case "Expenses": return ["Date", "Expense Type", "Category", "Amount", "Payment Method", "Remarks"]
      default:         return ["Date", "Transaction Type", "Description", "Amount", "Category", "Status"]
    }
  }
  function getCurrencyColumnsForReport(): string[] {
    switch (filters.reportType) {
      case "Billing":  return ["totalAmount"]
      case "Purchase": return ["totalValue"]
      case "Borrowed": return ["amount"]
      case "Expenses": return ["amount"]
      default:         return ["amount", "totalAmount", "totalValue"]
    }
  }

  // ------------------- PURCHASE CODE DECODER -------------------
  function decodePurchaseCode(raw: string): { value: number; valid: boolean } {
    const CODE_MAP: Record<string, string> = {
      D: "1", I: "2", N: "3", E: "4", S: "5", H: "6", J: "7", A: "8", T: "9", P: "0",
    }
    const code = raw.toUpperCase().replace(/\s+/g, "")
    if (!code) return { value: 0, valid: false }

    let out = ""
    for (const ch of code) {
      if (!(ch in CODE_MAP)) {
        return { value: 0, valid: false }
      }
      out += CODE_MAP[ch]
    }
    const num = out.replace(/^0+/, "") || "0"
    return { value: Number(num), valid: true }
  }
}
