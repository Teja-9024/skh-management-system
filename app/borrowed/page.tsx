"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useApi, useApiMutation } from "@/hooks/use-api"
import { exportToPDF } from "@/utils/exportToPDF"
import { exportToExcel } from "@/utils/exportToExcel"

interface TransactionData {
  transactionType: "borrowed" | "lent" | "repayment"
  date: string
  amount: number
  paymentMethod: string
  destination: string
  personName: string
  personName?: string // keep for backward-compat if API returns it
  contactInfo: string
  primaryPurpose: string
  expectedReturnDate: string
  interestRate: number
  interestType: string
  status: string
  detailedDescription: string
  lenderName: string
  borrowerName: string
}

export default function BorrowedMoney() {
  const [formData, setFormData] = useState<TransactionData>({
    transactionType: "lent",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    paymentMethod: "Cash",
    destination: "Individual Person",
    personName: "",
    contactInfo: "",
    primaryPurpose: "Market Purchase",
    expectedReturnDate: "",
    interestRate: 0,
    interestType: "No Interest",
    status: "Active/Outstanding",
    detailedDescription: "",
    lenderName: "",
    borrowerName: "",
  })

  const [transactions, setTransactions] = useState<
    (TransactionData & { id: string })[]
  >([])
  const [activeFilter, setActiveFilter] = useState<
    "all" | "borrowed" | "lent" | "repayment"
  >("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { loading: transactionsLoading, execute: fetchTransactions } = useApi()
  const { mutate: createTransaction } = useApiMutation()

  const paymentMethods = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque"]
  const destinations = ["Individual Person", "Business", "Bank", "Financial Institution"]
  const purposes = ["Market Purchase", "Personal Use", "Business Expense", "Emergency", "Investment", "Other"]
  const interestTypes = ["No Interest", "Simple Interest", "Compound Interest", "Fixed Rate"]
  const statuses = ["Active/Outstanding", "Completed", "Overdue", "Partial Payment"]

  useEffect(() => {
    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTransactions = async () => {
    try {
      const data = await fetchTransactions("/api/money-transactions?limit=50")
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error("Failed to load transactions:", error)
    }
  }

  // Filter transactions by active filter
  const filteredTransactions = transactions.filter((t) =>
    activeFilter === "all" ? true : t.transactionType === activeFilter
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.transactionType === "borrowed" && !formData.lenderName.trim()) {
      alert("Please enter lender's name")
      return
    }
    if (formData.transactionType === "lent" && !formData.borrowerName.trim()) {
      alert("Please enter borrower's name")
      return
    }
    if (formData.amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        transactionType: formData.transactionType.toUpperCase(), // API expects ENUM-like
        date: formData.date,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod.toUpperCase(),
        destination: formData.destination,
        personName:
          formData.transactionType === "borrowed"
            ? formData.lenderName
            : formData.borrowerName,
        contactInfo: formData.contactInfo,
        primaryPurpose: formData.primaryPurpose,
        expectedReturnDate: formData.expectedReturnDate || null,
        interestRate: formData.interestRate,
        interestType: formData.interestType.toUpperCase().replace(" ", "_"),
        status: formData.status.toUpperCase().replace("/", "_"),
        detailedDescription: formData.detailedDescription,
        lenderName: formData.lenderName,
        borrowerName: formData.borrowerName,
      }

      await createTransaction("/api/money-transactions", { body: payload })

      // Reset form
      setFormData({
        transactionType: "lent",
        date: new Date().toISOString().split("T")[0],
        amount: 0,
        paymentMethod: "Cash",
        destination: "Individual Person",
        personName: "",
        contactInfo: "",
        primaryPurpose: "Market Purchase",
        expectedReturnDate: "",
        interestRate: 0,
        interestType: "No Interest",
        status: "Active/Outstanding",
        detailedDescription: "",
        lenderName: "",
        borrowerName: "",
      })

      await loadTransactions()
      alert("Transaction saved successfully!")
    } catch (error: any) {
      alert(`Failed to save transaction: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const editTransaction = (transaction: TransactionData & { id: string }) => {
    setFormData({
      transactionType: transaction.transactionType,
      date: transaction.date,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      destination: transaction.destination,
      personName: transaction.personName || "",
      contactInfo: transaction.contactInfo,
      primaryPurpose: transaction.primaryPurpose,
      expectedReturnDate: transaction.expectedReturnDate,
      interestRate: transaction.interestRate,
      interestType: transaction.interestType,
      status: transaction.status,
      detailedDescription: transaction.detailedDescription,
      lenderName: transaction.lenderName,
      borrowerName: transaction.borrowerName,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return
    try {
      // await deleteTransactionMutation(`/api/money-transactions/${transactionId}`)
      await loadTransactions()
      alert("Transaction deleted successfully!")
    } catch (error) {
      alert("Failed to delete transaction")
    }
  }

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.transactionType === "borrowed") acc.borrowed += t.amount
      else if (t.transactionType === "lent") acc.lent += t.amount
      return acc
    },
    { borrowed: 0, lent: 0 }
  )

  const netOutstanding = totals.borrowed - totals.lent

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Money Management Tracker</h2>
        <p className="text-gray-600">
          Track borrowed money, lending, and money usage with detailed records
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Money Borrowed</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">
                ₹{totals.borrowed.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg sm:text-xl">📉</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Money Lent</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                ₹{totals.lent.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg sm:text-xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Net Outstanding</p>
              <p
                className={`text-lg sm:text-2xl font-bold ${
                  netOutstanding >= 0 ? "text-orange-600" : "text-green-600"
                }`}
              >
                ₹{Math.abs(netOutstanding).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-lg sm:text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Type + Form */}
      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6 mb-6">
        <h3 className="text-lg font-semibold mb-6">Transaction Type</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { key: "borrowed", title: "Money Borrowed", sub: "We received money from someone" },
            { key: "lent", title: "Money Lent", sub: "We gave money to someone" },
            { key: "repayment", title: "Repayment", sub: "Returning borrowed money" },
          ].map((opt) => (
            <div className="border rounded-lg p-4" key={opt.key}>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="transactionType"
                  value={opt.key}
                  checked={formData.transactionType === (opt.key as any)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      transactionType: e.target.value as TransactionData["transactionType"],
                    }))
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">{opt.title}</div>
                  <div className="text-sm text-gray-500">{opt.sub}</div>
                </div>
              </label>
            </div>
          ))}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))
                }
                placeholder="0"
                step="0.01"
                min="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.paymentMethod}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.transactionType === "borrowed"
                  ? "Lender's Name"
                  : formData.transactionType === "lent"
                  ? "Borrower's Name"
                  : "Lender's Name"}
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.lenderName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lenderName: e.target.value }))}
                placeholder={
                  formData.transactionType === "borrowed"
                    ? "Name of person who lent us money"
                    : formData.transactionType === "lent"
                    ? "Name of person who borrowed from us"
                    : "Name of person we're repaying"
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.transactionType === "borrowed"
                  ? "The person who lent us money"
                  : formData.transactionType === "lent"
                  ? "The person who borrowed from us"
                  : "The person we're repaying"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.transactionType === "borrowed"
                  ? "Borrower's Name"
                  : formData.transactionType === "lent"
                  ? "Lender's Name"
                  : "Borrower's Name"}
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.borrowerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, borrowerName: e.target.value }))}
                placeholder={
                  formData.transactionType === "borrowed"
                    ? "Our name (we borrowed)"
                    : formData.transactionType === "lent"
                    ? "Our name (we lent)"
                    : "Name of person receiving repayment"
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.transactionType === "borrowed"
                  ? "Our name (we are the borrower)"
                  : formData.transactionType === "lent"
                  ? "Our name (we are the lender)"
                  : "The person receiving the repayment"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.contactInfo}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactInfo: e.target.value }))}
                placeholder="Phone number or address"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold mb-4">Purpose & Usage</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Purpose</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.primaryPurpose}
                  onChange={(e) => setFormData((prev) => ({ ...prev, primaryPurpose: e.target.value }))}
                >
                  {purposes.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Return Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
                  placeholder="dd-mm-yyyy"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.interestRate || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, interestRate: Number.parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  step="0.1"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interest Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.interestType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, interestType: e.target.value }))}
                >
                  {interestTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                rows={4}
                value={formData.detailedDescription}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, detailedDescription: e.target.value }))
                }
                placeholder="Describe what this money was used for, any special terms, or additional notes..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h3 className="text-lg font-semibold mb-2 sm:mb-0">Recent Transactions</h3>

          {transactions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-0">
              <button
                type="button"
                onClick={() => {
                  const data = filteredTransactions.map((t) => ({
                    date: new Date(t.date).toLocaleDateString("en-IN"),
                    type: t.transactionType.charAt(0).toUpperCase() + t.transactionType.slice(1),
                    lender: t.lenderName,
                    borrower: t.borrowerName,
                    amount: t.amount,
                    purpose: t.primaryPurpose,
                    status: t.status,
                    paymentMethod: t.paymentMethod,
                    contactInfo: t.contactInfo,
                    expectedReturnDate: t.expectedReturnDate
                      ? new Date(t.expectedReturnDate).toLocaleDateString("en-IN")
                      : "N/A",
                    interestRate: t.interestRate,
                    interestType: t.interestType,
                    description: t.detailedDescription,
                  }))
                  exportToPDF({
                    title: "Money Transactions Report",
                    dateRange: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
                    columns: [
                      "date",
                      "type",
                      "lender",
                      "borrower",
                      "amount",
                      "purpose",
                      "status",
                      "paymentMethod",
                      "contactInfo",
                      "expectedReturnDate",
                      "interestRate",
                      "interestType",
                      "description",
                    ],
                    data,
                    columnLabels: [
                      "Date",
                      "Type",
                      "Lender",
                      "Borrower",
                      "Amount",
                      "Purpose",
                      "Status",
                      "Payment Method",
                      "Contact Info",
                      "Expected Return",
                      "Interest Rate",
                      "Interest Type",
                      "Description",
                    ],
                    currencyColumns: ["amount", "interestRate"],
                    orientation: "landscape",
                  })
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                📄 Download PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  const data = filteredTransactions.map((t) => ({
                    date: new Date(t.date).toLocaleDateString("en-IN"),
                    type: t.transactionType.charAt(0).toUpperCase() + t.transactionType.slice(1),
                    lender: t.lenderName,
                    borrower: t.borrowerName,
                    amount: t.amount,
                    purpose: t.primaryPurpose,
                    status: t.status,
                    paymentMethod: t.paymentMethod,
                    contactInfo: t.contactInfo,
                    expectedReturnDate: t.expectedReturnDate
                      ? new Date(t.expectedReturnDate).toLocaleDateString("en-IN")
                      : "N/A",
                    interestRate: t.interestRate,
                    interestType: t.interestType,
                    description: t.detailedDescription,
                  }))
                  exportToExcel({
                    title: "Money Transactions Report",
                    dateRange: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
                    columns: [
                      "date",
                      "type",
                      "lender",
                      "borrower",
                      "amount",
                      "purpose",
                      "status",
                      "paymentMethod",
                      "contactInfo",
                      "expectedReturnDate",
                      "interestRate",
                      "interestType",
                      "description",
                    ],
                    data,
                    columnLabels: [
                      "Date",
                      "Type",
                      "Lender",
                      "Borrower",
                      "Amount",
                      "Purpose",
                      "Status",
                      "Payment Method",
                      "Contact Info",
                      "Expected Return",
                      "Interest Rate",
                      "Interest Type",
                      "Description",
                    ],
                    currencyColumns: ["amount", "interestRate"],
                  })
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                📊 Download Excel
              </button>
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeFilter === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("borrowed")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeFilter === "borrowed"
                ? "bg-red-600 text-white"
                : "bg-red-100 text-red-800 hover:bg-red-200"
            }`}
          >
            Borrowed
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("lent")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeFilter === "lent"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            Lent
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("repayment")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeFilter === "repayment"
                ? "bg-green-600 text-white"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            Repayments
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {transactionsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading transactions...</div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, index) => (
              <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="text-lg font-bold text-blue-600">#{transaction.id}</div>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.transactionType === "borrowed"
                        ? "bg-red-100 text-red-800"
                        : transaction.transactionType === "lent"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {transaction.transactionType.charAt(0).toUpperCase() +
                      transaction.transactionType.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="font-medium text-gray-500">Date</div>
                    <div className="font-semibold">
                      {new Date(transaction.date).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Amount</div>
                    <div className="text-lg font-bold text-gray-900">
                      ₹{transaction.amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-medium text-gray-500 mb-1">Lender</div>
                  <div className="font-semibold text-gray-800">{transaction.lenderName}</div>
                </div>

                <div>
                  <div className="font-medium text-gray-500 mb-1">Borrower</div>
                  <div className="font-semibold text-gray-800">{transaction.borrowerName}</div>
                </div>

                <div>
                  <div className="font-medium text-gray-500 mb-1">Purpose</div>
                  <div className="font-semibold text-gray-800">{transaction.primaryPurpose}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="font-medium text-gray-500">Payment Method</div>
                    <div className="font-semibold">💳 {transaction.paymentMethod}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Status</div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        transaction.status === "Active/Outstanding" || transaction.status === "Active"
                          ? "bg-yellow-100 text-yellow-800"
                          : transaction.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.status === "Active/Outstanding" || transaction.status === "Active"
                        ? "⏳ Active"
                        : transaction.status === "Completed"
                        ? "✅ Completed"
                        : "❌ " + (transaction.status || "Active")}
                    </span>
                  </div>
                </div>

                {transaction.contactInfo && (
                  <div>
                    <div className="font-medium text-gray-500 mb-1">Contact</div>
                    <div className="text-sm text-blue-600">📞 {transaction.contactInfo}</div>
                  </div>
                )}

                {transaction.expectedReturnDate && (
                  <div>
                    <div className="font-medium text-gray-500 mb-1">Expected Return</div>
                    <div className="text-sm text-gray-600">
                      📅 {new Date(transaction.expectedReturnDate).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                )}

                {transaction.interestRate > 0 && (
                  <div>
                    <div className="font-medium text-gray-500 mb-1">Interest</div>
                    <div className="text-sm text-gray-600">
                      💹 {transaction.interestRate}% {transaction.interestType}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => editTransaction(transaction)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTransaction(transaction.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg font-medium mb-2">No Transactions Found</div>
              <div className="text-sm">No transactions found for the selected filter.</div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          {transactionsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading transactions...</div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lender
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrower
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.transactionType === "borrowed"
                              ? "bg-red-100 text-red-800"
                              : transaction.transactionType === "lent"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transaction.transactionType.charAt(0).toUpperCase() +
                            transaction.transactionType.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{transaction.lenderName}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{transaction.borrowerName}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{transaction.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.primaryPurpose}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.status}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          type="button"
                          onClick={() => editTransaction(transaction)}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(transaction.id)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500">
                      No transactions found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
