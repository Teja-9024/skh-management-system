"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useApi, useApiMutation } from "@/hooks/use-api"

interface BillAllItem {
  id: string
  billNumber: string
  date: string
  sellerName?: string | null
  totalAmount: number
  remarks?: string | null
  // payments (optional in API -> default to 0)
  cashPayment?: number | null
  onlinePayment?: number | null
  borrowedAmount?: number | null
  // relations
  customer?: { id: string; name: string; mobile?: string | null }
  items?: Array<{
    id: string
    quantity: number
    salePrice: number
    // purchaseCode may exist in DB but we will NOT show it
    purchaseCode?: string
    product?: { name: string }
    productName?: string // fallback support
  }>
}

type DateMode = "specific" | "month" | "year" | "range"

export default function AllBillsPage() {
  const { execute: api } = useApi()
  const { mutate: deleteBill } = useApiMutation()

  const [bills, setBills] = useState<BillAllItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [dateMode, setDateMode] = useState<DateMode>("specific")
  const [specificDate, setSpecificDate] = useState<string>("")
  const [month, setMonth] = useState<string>("") // yyyy-mm
  const [year, setYear] = useState<string>("") // yyyy
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")

  const money = (n?: number | null) => `₹${Number(n || 0).toFixed(2)}`
  const cls = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ")

  // Build date range params based on mode
  const dateParams = useMemo(() => {
    const params: Record<string, string> = {}
    const pad2 = (n: number) => String(n).padStart(2, "0")

    if (dateMode === "specific" && specificDate) {
      params.fromDate = specificDate
      params.toDate = specificDate
    } else if (dateMode === "month" && month) {
      const [y, m] = month.split("-")
      if (y && m) {
        const start = `${y}-${m}-01`
        const last = new Date(Number(y), Number(m), 0).getDate()
        const end = `${y}-${m}-${pad2(last)}`
        params.fromDate = start
        params.toDate = end
      }
    } else if (dateMode === "year" && year) {
      params.fromDate = `${year}-01-01`
      params.toDate = `${year}-12-31`
    } else if (dateMode === "range" && fromDate && toDate) {
      params.fromDate = fromDate
      params.toDate = toDate
    }

    return params
  }, [dateMode, specificDate, month, year, fromDate, toDate])

  const fetchPage = useCallback(
    async (nextPage: number, replace = false) => {
      if (loading) return
      setLoading(true)
      try {
        const qs = new URLSearchParams({ page: String(nextPage), limit: "10" })
        if (search.trim()) qs.set("search", search.trim())
        if (dateParams.fromDate) qs.set("fromDate", dateParams.fromDate)
        if (dateParams.toDate) qs.set("toDate", dateParams.toDate)

        const res = await api(`/api/bills?${qs.toString()}`)
        const newBills: BillAllItem[] = res.bills || []
        const total: number = res.total || 0
        const combined = replace ? newBills : [...bills, ...newBills]

        setBills(combined)
        setPage(nextPage)
        setHasMore(combined.length < total)
      } catch (e) {
        console.error("Failed to load bills", e)
      } finally {
        setLoading(false)
      }
    },
    [api, bills, dateParams.fromDate, dateParams.toDate, loading, search]
  )

  // Reset and load when filters change
  useEffect(() => {
    setBills([])
    setPage(1)
    setHasMore(true)
    fetchPage(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateParams.fromDate, dateParams.toDate])

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPage(page + 1)
        }
      },
      { rootMargin: "200px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [fetchPage, hasMore, loading, page])

  // Helpers
  const resetFilters = () => {
    setSearch("")
    setDateMode("specific")
    setSpecificDate("")
    setMonth("")
    setYear("")
    setFromDate("")
    setToDate("")
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">All Bills</h2>
        <p className="text-gray-600">Browse, filter and search all bills</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search (name, bill no, seller)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
              placeholder="Type to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter Mode</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
              value={dateMode}
              onChange={(e) => setDateMode(e.target.value as DateMode)}
            >
              <option value="specific">Specific Date</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="range">Date Range</option>
            </select>
          </div>

          {dateMode === "specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
              />
            </div>
          )}

          {dateMode === "month" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <input
                type="month"
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          )}

          {dateMode === "year" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                min={1900}
                max={9999}
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                placeholder="2025"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          )}

          {dateMode === "range" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPage(1, true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
        {/* MOBILE (cards) */}
        <div className="block lg:hidden space-y-4">
          {bills.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">No bills found</div>
          ) : (
            bills.map((bill, index) => {
              const items = bill.items || []
              return (
                <div key={bill.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  {/* header */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs font-semibold">
                        Bill #{bill.billNumber}
                      </span>
                      <span className="text-[11px] text-gray-400">#{index + 1}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(bill.date).toLocaleDateString("en-IN")}
                    </div>
                  </div>

                  {/* customer / seller */}
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Customer</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {bill.customer?.name || "N/A"}
                      </div>
                    </div>
                    {(bill.customer?.mobile) && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">Mobile</div>
                        <div className="text-sm font-medium text-blue-600">{bill.customer?.mobile}</div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Seller</div>
                      <div className="text-sm font-medium text-gray-800">{bill.sellerName || "N/A"}</div>
                    </div>
                  </div>

                  {/* items list */}
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-600 mb-2">Items</div>
                    <ul className="space-y-2">
                      {items.map((it) => {
                        const name = it.product?.name || it.productName || "Item"
                        const qty = Number(it.quantity || 0)
                        const unit = Number(it.salePrice || 0)
                        const sub = qty * unit
                        return (
                          <li key={it.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                            <div className="flex items-baseline justify-between gap-3">
                              <div className="font-medium text-gray-800 truncate">
                                {name} <span className="ml-2 text-xs text-gray-500">(Qty: {qty})</span>
                              </div>
                              <div className="tabular-nums font-mono text-sm font-semibold text-gray-900">
                                {money(sub)}
                              </div>
                            </div>
                            <div className="mt-1 text-[12px] text-gray-600">
                              {money(unit)} <span className="text-gray-400">×</span> {qty}
                            </div>
                            <div className="mt-0.5 text-[11px] text-gray-500">
                              Code: {it.purchaseCode || "N/A"}
                            </div>
                          </li>

                        )
                      })}
                    </ul>
                  </div>

                  {/* payments summary */}
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="text-gray-500 text-center">Cash</div>
                        <div className="tabular-nums font-mono font-semibold text-center">
                          {money(bill.cashPayment)}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-gray-500 text-center">Online</div>
                        <div className="tabular-nums font-mono font-semibold text-center">
                          {money(bill.onlinePayment)}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-gray-500 text-center">Borrow</div>
                        <div className="tabular-nums font-mono font-semibold text-center text-orange-600">
                          {money(bill.borrowedAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* remarks */}
                  {bill.remarks ? (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-500 mb-1">Remarks</div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{bill.remarks}</div>
                    </div>
                  ) : null}

                  {/* total */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                      <div className="text-sm font-medium text-emerald-700">Total Amount</div>
                      <div className="text-lg font-bold tabular-nums font-mono text-emerald-700">
                        {money(bill.totalAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* DESKTOP (table) */}
        <div className="hidden lg:block overflow-x-auto">
          {bills.length === 0 && !loading ? (
            <div className="text-center py-12 text-gray-500">No bills found</div>
          ) : (
            <table className="min-w-[1100px] w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SER NO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">BILL NO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NAME OF CUSTOMER</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">MOB NO OF CUSTOMER</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ITEMS</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">CASH</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ONLINE</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">BORROW</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SELLER</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">REMARKS</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">TOTAL</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {bills.map((bill, idx) => {
                  const items = bill.items || []
                  const itemsTotal = items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.salePrice || 0), 0)

                  return (
                    <tr key={bill.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{bill.billNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{new Date(bill.date).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{bill.customer?.name || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{bill.customer?.mobile || "N/A"}</td>

                      {/* items cell */}
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="space-y-2">
                          {items.map((it) => {
                            const name = it.product?.name || it.productName || "Item"
                            const qty = Number(it.quantity || 0)
                            const unit = Number(it.salePrice || 0)
                            const sub = qty * unit
                            return (
                              <div key={it.id} className="rounded-md border border-gray-200 bg-gray-50 p-2.5">
                                <div className="flex items-baseline justify-between gap-3">
                                  <div className="font-medium truncate">{name}</div>
                                  <div className="tabular-nums font-mono text-gray-800">{money(sub)}</div>
                                </div>
                                <div className="mt-1 text-[12px] text-gray-600">
                                  {money(unit)} <span className="text-gray-400">×</span> {qty}
                                </div>
                                <div className="mt-0.5 text-[11px] text-gray-500">
                                  Purchage Code: {it.purchaseCode || "N/A"}
                                </div>
                              </div>
                            )
                          })}
                          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2 text-[12px] font-semibold">
                            <span className="text-gray-600">Items Total</span>
                            <span className="tabular-nums font-mono">{money(itemsTotal)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-right tabular-nums font-mono text-gray-900">
                        {money(bill.cashPayment)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-mono text-gray-900">
                        {money(bill.onlinePayment)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-mono text-gray-900">
                        {money(bill.borrowedAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{bill.sellerName || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{bill.remarks || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-mono font-semibold text-gray-900">
                        {money(bill.totalAmount ?? itemsTotal)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.assign('/billing')}
                            className="px-3 py-1.5 rounded bg-blue-500 text-white text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Are you sure you want to delete this bill?')) return
                              try {
                                await deleteBill(`/api/bills/${bill.id}`, { method: 'DELETE' })
                                setBills((prev) => prev.filter((b) => b.id !== bill.id))
                              } catch (e) {
                                alert('Failed to delete bill')
                              }
                            }}
                            className="px-3 py-1.5 rounded bg-red-500 text-white text-xs hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* infinite-scroll sentinel */}
        <div ref={sentinelRef} className="h-12 flex items-center justify-center">
          {loading ? (
            <span className="text-gray-500 text-sm">Loading...</span>
          ) : hasMore ? (
            <span className="text-gray-400 text-xs">Scroll to load more</span>
          ) : (
            <span className="text-gray-400 text-xs">No more results</span>
          )}
        </div>
      </div>
    </div>
  )
}
