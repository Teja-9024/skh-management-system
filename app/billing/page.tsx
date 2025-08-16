"use client"

import type React from "react"
import { useState } from "react"

interface BillItem {
  productName: string
  quantity: number
  salePrice: number
  purchaseCode: string
  total: number
}

interface BillData {
  billNumber: string
  date: string
  sellerName: string
  customerName: string
  customerMobile: string
  items: BillItem[]
  savingBalance: number
  cashPayment: number
  onlinePayment: number
  borrowedAmount: number
  remarks: string
}

export default function BillingSystem() {
  const [formData, setFormData] = useState<BillData>({
    billNumber: "1",
    date: new Date().toISOString().split("T")[0],
    sellerName: "",
    customerName: "",
    customerMobile: "",
    items: [],
    savingBalance: 0,
    cashPayment: 0,
    onlinePayment: 0,
    borrowedAmount: 0,
    remarks: "",
  })

  const [currentItem, setCurrentItem] = useState<BillItem>({
    productName: "",
    quantity: 0,
    salePrice: 0,
    purchaseCode: "",
    total: 0,
  })

  const [bills, setBills] = useState<(BillData & { id: string; totalAmount: number })[]>([])

  const purchaseCodes = ["D-1", "I-2", "N-3", "E-4", "S-5", "H-6", "J-7", "A-8", "T-9", "P-0"]

  const updateCurrentItem = (field: keyof BillItem, value: any) => {
    const updatedItem = { ...currentItem, [field]: value }

    if (field === "quantity" || field === "salePrice") {
      updatedItem.total = updatedItem.quantity * updatedItem.salePrice
    }

    setCurrentItem(updatedItem)
  }

  const addItem = () => {
    if (!currentItem.productName.trim()) {
      alert("Please enter product name")
      return
    }

    if (currentItem.quantity <= 0) {
      alert("Please enter valid quantity")
      return
    }

    if (currentItem.salePrice <= 0) {
      alert("Please enter valid sale price")
      return
    }

    if (!currentItem.purchaseCode) {
      alert("Please select purchase code")
      return
    }

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...currentItem }],
    }))

    // Reset current item
    setCurrentItem({
      productName: "",
      quantity: 0,
      salePrice: 0,
      purchaseCode: "",
      total: 0,
    })
  }

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerName.trim()) {
      alert("Please enter customer name")
      return
    }

    if (formData.items.length === 0) {
      alert("Please add at least one item")
      return
    }

    const newBill = {
      ...formData,
      id: Date.now().toString(),
      totalAmount,
    }

    setBills((prev) => [newBill, ...prev])

    // Reset form
    setFormData({
      billNumber: (Number.parseInt(formData.billNumber) + 1).toString(),
      date: new Date().toISOString().split("T")[0],
      sellerName: "",
      customerName: "",
      customerMobile: "",
      items: [],
      savingBalance: 0,
      cashPayment: 0,
      onlinePayment: 0,
      borrowedAmount: 0,
      remarks: "",
    })

    alert("Bill saved successfully!")
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Billing System</h2>
        <p className="text-gray-600">Create and manage customer bills</p>
      </div>

      <div className="bg-white rounded-lg card-shadow p-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.billNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, billNumber: e.target.value }))}
                placeholder="1"
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Seller's Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.sellerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, sellerName: e.target.value }))}
                placeholder="Enter seller name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.customerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Mobile</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.customerMobile}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerMobile: e.target.value }))}
                placeholder="Enter mobile number"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Add Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={currentItem.productName}
                  onChange={(e) => updateCurrentItem("productName", e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={currentItem.quantity || ""}
                  onChange={(e) => updateCurrentItem("quantity", Number.parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale Price</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={currentItem.salePrice || ""}
                  onChange={(e) => updateCurrentItem("salePrice", Number.parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  step="0.01"
                  min="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Code</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={currentItem.purchaseCode}
                  onChange={(e) => updateCurrentItem("purchaseCode", e.target.value)}
                >
                  <option value="">e.g., DISH</option>
                  {purchaseCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Decoded: ₹0</p>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Add Item
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">Code: D-1, I-2, N-3, E-4, S-5, H-6, J-7, A-8, T-9, P-0</p>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.length > 0 ? (
                    formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.purchaseCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{item.salePrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{item.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No items added yet. Fill the form above and click "Add Item".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Saving Balance</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.savingBalance || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, savingBalance: Number.parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cash Payment</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.cashPayment || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cashPayment: Number.parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Online Payment</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.onlinePayment || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, onlinePayment: Number.parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Borrowed Amount (Due)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.borrowedAmount || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, borrowedAmount: Number.parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                rows={3}
                value={formData.remarks}
                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter any remarks"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold mb-4">
              <span>Total Amount:</span>
              <span className="text-blue-600">₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium"
              >
                Save Bill
              </button>
            </div>
          </div>
        </form>
      </div>

      {bills.length > 0 && (
        <div className="mt-8 bg-white rounded-lg card-shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Bills</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.slice(0, 10).map((bill) => (
                  <tr key={bill.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.billNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(bill.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.customerMobile || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.items.length} items</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{bill.totalAmount.toFixed(2)}
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
