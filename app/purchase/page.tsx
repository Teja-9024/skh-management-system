"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useApi, useApiMutation } from "@/hooks/use-api"
import { exportToPDF } from "@/utils/exportToPDF"
import { exportToExcel } from "@/utils/exportToExcel"

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
    stockStatus: "AVAILABLE",
    totalValue: 0,
    paymentType: "CASH",
    borrowedAmount: 0,
    remarks: "",
  })

  const [purchases, setPurchases] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: purchasesData, loading: purchasesLoading, execute: fetchPurchases } = useApi()
  const { mutate: createPurchase } = useApiMutation()

  const stockStatuses = ["AVAILABLE", "OUT_OF_STOCK", "LOW_STOCK", "ORDERED"]
  const paymentTypes = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE"]

  useEffect(() => {
    loadPurchases()
  }, [])

  const loadPurchases = async () => {
    try {
      const data = await fetchPurchases('/api/purchases?limit=10')
      setPurchases(data.purchases || [])
    } catch (error) {
      console.error('Failed to load purchases:', error)
    }
  }

  const updateFormData = (field: keyof PurchaseData, value: any) => {
    const updatedData = { ...formData, [field]: value }

    if (field === "purchasePrice" || field === "quantity") {
      updatedData.totalValue = updatedData.purchasePrice * updatedData.quantity
    }

    setFormData(updatedData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true)

    try {
      const purchaseData = {
        purchaseDate: formData.purchaseDate,
        product: {
          name: formData.productName,
        },
        supplier: {
          name: formData.supplierName,
        },
        purchasePrice: formData.purchasePrice,
        quantity: formData.quantity,
        stockStatus: formData.stockStatus,
        totalValue: formData.totalValue,
        paymentType: formData.paymentType,
        borrowedAmount: formData.borrowedAmount,
        remarks: formData.remarks,
      }

      await createPurchase('/api/purchases', { body: purchaseData })

      // Reset form
      setFormData({
        purchaseDate: new Date().toISOString().split("T")[0],
        productName: "",
        supplierName: "",
        purchasePrice: 0,
        quantity: 0,
        stockStatus: "AVAILABLE",
        totalValue: 0,
        paymentType: "CASH",
        borrowedAmount: 0,
        remarks: "",
      })

      // Reload purchases
      await loadPurchases()
      
      alert("Purchase saved successfully!")
    } catch (error: any) {
      alert(`Failed to save purchase: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit purchase function
  const editPurchase = (purchase: any) => {
    setFormData({
      purchaseDate: purchase.purchaseDate,
      productName: purchase.product?.name || purchase.productName || "",
      supplierName: purchase.supplier?.name || purchase.supplierName || "",
      purchasePrice: purchase.purchasePrice || 0,
      quantity: purchase.quantity || 0,
      stockStatus: purchase.stockStatus || "AVAILABLE",
      totalValue: purchase.totalValue || 0,
      paymentType: purchase.paymentType || "CASH",
      borrowedAmount: purchase.borrowedAmount || 0,
      remarks: purchase.remarks || "",
    })
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete purchase function
  const deletePurchase = async (purchaseId: string) => {
    if (confirm('Are you sure you want to delete this purchase?')) {
      try {
        // You'll need to implement the delete API endpoint
        // await deletePurchaseMutation(`/api/purchases/${purchaseId}`)
        // Reload purchases after deletion
        await loadPurchases()
        alert('Purchase deleted successfully!')
      } catch (error) {
        alert('Failed to delete purchase')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Market Purchase Entry</h2>
        <p className="text-gray-600">Record inventory purchases from suppliers</p>
      </div>

      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    {status.replace('_', ' ')}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                    {type.replace('_', ' ')}
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
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Purchase"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-white rounded-lg card-shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h3 className="text-lg font-semibold mb-2 sm:mb-0">Recent Purchases</h3>
          
          {/* Download Buttons */}
          {purchases.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  const data = purchases.map(purchase => ({
                    date: new Date(purchase.purchaseDate).toLocaleDateString("en-IN"),
                    product: purchase.product?.name || purchase.productName || "N/A",
                    supplier: purchase.supplier?.name || purchase.supplierName || "N/A",
                    quantity: purchase.quantity,
                    purchasePrice: purchase.purchasePrice,
                    totalValue: purchase.totalValue,
                    stockStatus: purchase.stockStatus?.replace('_', ' '),
                    paymentType: purchase.paymentType?.replace('_', ' '),
                    borrowedAmount: purchase.borrowedAmount,
                    remarks: purchase.remarks
                  }))
                  
                  exportToPDF({
                    title: "Market Purchase Report",
                    dateRange: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
                    columns: ["date", "product", "supplier", "quantity", "purchasePrice", "totalValue", "stockStatus", "paymentType", "borrowedAmount", "remarks"],
                    data,
                    columnLabels: ["Date", "Product", "Supplier", "Quantity", "Purchase Price", "Total Value", "Stock Status", "Payment Type", "Borrowed Amount", "Remarks"],
                    currencyColumns: ["purchasePrice", "totalValue", "borrowedAmount"],
                    orientation: 'landscape'
                  })
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => {
                  const data = purchases.map(purchase => ({
                    date: new Date(purchase.purchaseDate).toLocaleDateString("en-IN"),
                    product: purchase.product?.name || purchase.productName || "N/A",
                    supplier: purchase.supplier?.name || purchase.supplierName || "N/A",
                    quantity: purchase.quantity,
                    purchasePrice: purchase.purchasePrice,
                    totalValue: purchase.totalValue,
                    stockStatus: purchase.stockStatus?.replace('_', ' '),
                    paymentType: purchase.paymentType?.replace('_', ' '),
                    borrowedAmount: purchase.borrowedAmount,
                    remarks: purchase.remarks
                  }))
                  
                  exportToExcel({
                    title: "Market Purchase Report",
                    dateRange: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
                    columns: ["date", "product", "supplier", "quantity", "purchasePrice", "totalValue", "stockStatus", "paymentType", "borrowedAmount", "remarks"],
                    data,
                    columnLabels: ["Date", "Product", "Supplier", "Quantity", "Purchase Price", "Total Value", "Stock Status", "Payment Type", "Borrowed Amount", "Remarks"],
                    currencyColumns: ["purchasePrice", "totalValue", "borrowedAmount"]
                  })
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                📊 Download Excel
              </button>
            </div>
          )}
        </div>
        {purchasesLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading purchases...</div>
          </div>
        ) : purchases.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="text-lg font-bold text-blue-600">#{purchase.id}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(purchase.purchaseDate).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-500 mb-1">Product</div>
                    <div className="font-semibold text-gray-800">
                      {purchase.product?.name || purchase.productName || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-500 mb-1">Supplier</div>
                    <div className="font-semibold text-gray-800">
                      {purchase.supplier?.name || purchase.supplierName || "N/A"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="font-medium text-gray-500">Quantity</div>
                      <div className="font-semibold">{purchase.quantity}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Purchase Price</div>
                      <div className="font-semibold">₹{purchase.purchasePrice}</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-500 mb-1">Total Value</div>
                    <div className="text-lg font-bold text-green-600">₹{(purchase.totalValue || 0).toLocaleString("en-IN")}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="font-medium text-gray-500">Stock Status</div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        purchase.stockStatus === "AVAILABLE"
                          ? "bg-green-100 text-green-800"
                          : purchase.stockStatus === "LOW_STOCK"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                        {purchase.stockStatus?.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Payment Type</div>
                      <div className="font-semibold">{purchase.paymentType?.replace('_', ' ')}</div>
                    </div>
                  </div>

                  {purchase.borrowedAmount > 0 && (
                    <div>
                      <div className="font-medium text-gray-500">Borrowed Amount</div>
                      <div className="font-semibold text-orange-600">₹{purchase.borrowedAmount}</div>
                    </div>
                  )}

                  {purchase.remarks && (
                    <div>
                      <div className="font-medium text-gray-500 mb-1">Remarks</div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {purchase.remarks}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => editPurchase(purchase)}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deletePurchase(purchase.id)}
                      className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Price
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
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
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(purchase.purchaseDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.product?.name || purchase.productName || "N/A"}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.supplier?.name || purchase.supplierName || "N/A"}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.quantity}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{purchase.purchasePrice}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{(purchase.totalValue || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            purchase.stockStatus === "AVAILABLE"
                              ? "bg-green-100 text-green-800"
                              : purchase.stockStatus === "LOW_STOCK"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {purchase.stockStatus?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editPurchase(purchase)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deletePurchase(purchase.id)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500">No purchases found. Create your first purchase above.</div>
          </div>
        )}
      </div>
    </div>
  )
}
