"use client"

import type React from "react"
import { useState } from "react"

interface PurchaseData {
  purchaseDate: string
  productName: string
  supplierName: string
  purchasePrice: number
  quantity: number
  stockStatus: string
  totalValue: number
  paymentType: string
  borrowedAmount: number
  remarks: string
}

export default function MarketPurchase() {
  const [formData, setFormData] = useState<PurchaseData>({
    purchaseDate: new Date().toISOString().split("T")[0],
    productName: "",
    supplierName: "",
    purchasePrice: 0,
    quantity: 0,
    stockStatus: "Available",
    totalValue: 0,
    paymentType: "Cash",
    borrowedAmount: 0,
    remarks: "",
  })

  const [purchases, setPurchases] = useState<(PurchaseData & { id: string })[]>([])

  const stockStatuses = ["Available", "Out of Stock", "Low Stock", "Ordered"]
  const paymentTypes = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque"]

  const updateFormData = (field: keyof PurchaseData, value: any) => {
    const updatedData = { ...formData, [field]: value }

    if (field === "purchasePrice" || field === "quantity") {
      updatedData.totalValue = updatedData.purchasePrice * updatedData.quantity
    }

    setFormData(updatedData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productName.trim()) {
      alert("Please enter product name")
      return
    }

    if (!formData.supplierName.trim()) {
      alert("Please enter supplier name")
      return
    }

    if (formData.purchasePrice <= 0) {
      alert("Please enter a valid purchase price")
      return
    }

    if (formData.quantity <= 0) {
      alert("Please enter a valid quantity")
      return
    }

    const newPurchase = {
      ...formData,
      id: Date.now().toString(),
    }

    setPurchases((prev) => [newPurchase, ...prev])

    // Reset form
    setFormData({
      purchaseDate: new Date().toISOString().split("T")[0],
      productName: "",
      supplierName: "",
      purchasePrice: 0,
      quantity: 0,
      stockStatus: "Available",
      totalValue: 0,
      paymentType: "Cash",
      borrowedAmount: 0,
      remarks: "",
    })

    alert("Purchase record saved successfully!")
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Market Purchase Entry</h2>
        <p className="text-gray-600">Record inventory purchases from suppliers</p>
      </div>

      <div className="bg-white rounded-lg card-shadow p-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.purchaseDate}
                onChange={(e) => updateFormData("purchaseDate", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.productName}
                onChange={(e) => updateFormData("productName", e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.supplierName}
                onChange={(e) => updateFormData("supplierName", e.target.value)}
                placeholder="Enter supplier name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.purchasePrice || ""}
                onChange={(e) => updateFormData("purchasePrice", Number.parseFloat(e.target.value) || 0)}
                placeholder="0"
                step="0.01"
                min="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.quantity || ""}
                onChange={(e) => updateFormData("quantity", Number.parseInt(e.target.value) || 0)}
                placeholder="0"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.stockStatus}
                onChange={(e) => updateFormData("stockStatus", e.target.value)}
              >
                {stockStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Value</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                value={formData.totalValue.toFixed(2)}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.paymentType}
                onChange={(e) => updateFormData("paymentType", e.target.value)}
              >
                {paymentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Borrowed Amount</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.borrowedAmount || ""}
                onChange={(e) => updateFormData("borrowedAmount", Number.parseFloat(e.target.value) || 0)}
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
              rows={4}
              value={formData.remarks}
              onChange={(e) => updateFormData("remarks", e.target.value)}
              placeholder="Enter any remarks"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium"
            >
              Save Purchase
            </button>
          </div>
        </form>
      </div>

      {purchases.length > 0 && (
        <div className="mt-8 bg-white rounded-lg card-shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Purchases</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.slice(0, 10).map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(purchase.purchaseDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.supplierName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{purchase.totalValue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          purchase.stockStatus === "Available"
                            ? "bg-green-100 text-green-800"
                            : purchase.stockStatus === "Low Stock"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {purchase.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
