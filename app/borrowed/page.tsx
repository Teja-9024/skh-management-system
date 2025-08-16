"use client"

import type React from "react"
import { useState } from "react"

interface TransactionData {
  transactionType: "borrowed" | "lent" | "repayment"
  date: string
  amount: number
  paymentMethod: string
  destination: string
  personName: string
  contactInfo: string
  primaryPurpose: string
  expectedReturnDate: string
  interestRate: number
  interestType: string
  status: string
  detailedDescription: string
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
  })

  const [transactions, setTransactions] = useState<(TransactionData & { id: string })[]>([
    {
      id: "1",
      transactionType: "borrowed",
      date: "2025-08-15",
      amount: 1000,
      paymentMethod: "Cash",
      destination: "Individual Person",
      personName: "Dinesh",
      contactInfo: "9876543210",
      primaryPurpose: "Personal Use",
      expectedReturnDate: "",
      interestRate: 0,
      interestType: "No Interest",
      status: "Active",
      detailedDescription: "",
    },
    {
      id: "2",
      transactionType: "repayment",
      date: "2025-08-15",
      amount: 1000,
      paymentMethod: "Cash",
      destination: "Individual Person",
      personName: "Dinesh",
      contactInfo: "9876543210",
      primaryPurpose: "Market Purchase",
      expectedReturnDate: "",
      interestRate: 0,
      interestType: "No Interest",
      status: "Active",
      detailedDescription: "",
    },
  ])

  const paymentMethods = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque"]
  const destinations = ["Individual Person", "Business", "Bank", "Financial Institution"]
  const purposes = ["Market Purchase", "Personal Use", "Business Expense", "Emergency", "Investment", "Other"]
  const interestTypes = ["No Interest", "Simple Interest", "Compound Interest", "Fixed Rate"]
  const statuses = ["Active/Outstanding", "Completed", "Overdue", "Partial Payment"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.personName.trim()) {
      alert("Please enter person's name")
      return
    }

    if (formData.amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    const newTransaction = {
      ...formData,
      id: Date.now().toString(),
    }

    setTransactions((prev) => [newTransaction, ...prev])

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
    })

    alert("Transaction saved successfully!")
  }

  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.transactionType === "borrowed") {
        acc.borrowed += transaction.amount
      } else if (transaction.transactionType === "lent") {
        acc.lent += transaction.amount
      }
      return acc
    },
    { borrowed: 0, lent: 0 },
  )

  const netOutstanding = totals.borrowed - totals.lent

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Money Management Tracker</h2>
        <p className="text-gray-600">Track borrowed money, lending, and money usage with detailed records</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Money Borrowed</p>
              <p className="text-2xl font-bold text-red-600">₹{totals.borrowed.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xl">📉</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Money Lent</p>
              <p className="text-2xl font-bold text-blue-600">₹{totals.lent.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Outstanding</p>
              <p className={`text-2xl font-bold ${netOutstanding >= 0 ? "text-orange-600" : "text-green-600"}`}>
                ₹{Math.abs(netOutstanding).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg card-shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-6">Transaction Type</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="border rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="transactionType"
                value="borrowed"
                checked={formData.transactionType === "borrowed"}
                onChange={(e) => setFormData((prev) => ({ ...prev, transactionType: e.target.value as any }))}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">Money Borrowed</div>
                <div className="text-sm text-gray-500">We received money from someone</div>
              </div>
            </label>
          </div>

          <div className="border rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="transactionType"
                value="lent"
                checked={formData.transactionType === "lent"}
                onChange={(e) => setFormData((prev) => ({ ...prev, transactionType: e.target.value as any }))}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">Money Lent</div>
                <div className="text-sm text-gray-500">We gave money to someone</div>
              </div>
            </label>
          </div>

          <div className="border rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="transactionType"
                value="repayment"
                checked={formData.transactionType === "repayment"}
                onChange={(e) => setFormData((prev) => ({ ...prev, transactionType: e.target.value as any }))}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">Repayment</div>
                <div className="text-sm text-gray-500">Returning borrowed money</div>
              </div>
            </label>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.transactionType === "repayment" ? "Repaying To" : "Source (From Whom)"}
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.destination}
                onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
              >
                {destinations.map((dest) => (
                  <option key={dest} value={dest}>
                    {dest}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus mt-2"
                value={formData.personName}
                onChange={(e) => setFormData((prev) => ({ ...prev, personName: e.target.value }))}
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Person's Full Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.personName}
                onChange={(e) => setFormData((prev) => ({ ...prev, personName: e.target.value }))}
                placeholder={
                  formData.transactionType === "repayment"
                    ? "Name of person receiving the repayment"
                    : "Name of person who received the money"
                }
              />
              <p className="text-xs text-gray-500 mt-1">The individual person involved in this transaction</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
                onChange={(e) => setFormData((prev) => ({ ...prev, detailedDescription: e.target.value }))}
                placeholder="Describe what this money was used for, any special terms, or additional notes..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg card-shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs bg-gray-100 rounded">All</button>
            <button className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded">Borrowed</button>
            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded">Lent</button>
            <button className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded">Repayments</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source/Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.slice(0, 10).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.transactionType === "borrowed"
                          ? "bg-red-100 text-red-800"
                          : transaction.transactionType === "lent"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{transaction.personName}</div>
                    <div className="text-xs text-gray-500">{transaction.destination}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{transaction.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.primaryPurpose}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">View</button>
                    <button className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
