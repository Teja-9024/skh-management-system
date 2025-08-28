"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useApi, useApiMutation } from "@/hooks/use-api"
import { exportToPDF } from "@/utils/exportToPDF"
import { exportToExcel } from "@/utils/exportToExcel"

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

// Letter→Digit mapping
const CODE_MAP: Record<string, string> = {
  D: "1",
  I: "2",
  N: "3",
  E: "4",
  S: "5",
  H: "6",
  J: "7",
  A: "8",
  T: "9",
  P: "0",
}

// Decode helper: "DIN" -> 123
function decodePurchaseCode(raw: string): { value: number; valid: boolean } {
  const code = raw.toUpperCase().replace(/\s+/g, "")
  if (!code) return { value: 0, valid: false }

  let out = ""
  for (const ch of code) {
    if (!(ch in CODE_MAP)) {
      return { value: 0, valid: false }
    }
    out += CODE_MAP[ch]
  }

  // Remove leading zeros gracefully, but keep 0 if all zeros
  const num = out.replace(/^0+/, "") || "0"
  return { value: Number(num), valid: true }
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

  const [bills, setBills] = useState<(BillData & { id: string; totalAmount: number; customer: any; items: any[] })[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingBillId, setEditingBillId] = useState<string | null>(null)

  const { data: billsData, loading: billsLoading, execute: fetchBills } = useApi()
  const { mutate: createBill } = useApiMutation()
  const { mutate: mutateBill } = useApiMutation()
  const { mutate: deleteBillMutation } = useApiMutation()

  useEffect(() => {
    loadBills()
    generateNextBillNumber()
  }, [])

  const loadBills = async () => {
    try {
      // Only load bills for current date
      const today = new Date().toISOString().split("T")[0]
      const data = await fetchBills(`/api/bills?date=${today}`)
      setBills(data.bills || [])
    } catch (error) {
      console.error('Failed to load bills:', error)
    }
  }

  const generateNextBillNumber = async () => {
    try {
      const data = await fetchBills('/api/bills?limit=1')
      const lastBill = data.bills?.[0]
      if (lastBill) {
        const nextNumber = (parseInt(lastBill.billNumber) + 1).toString()
        setFormData(prev => ({ ...prev, billNumber: nextNumber }))
      }
    } catch (error) {
      console.error('Failed to generate bill number:', error)
    }
  }

  const updateCurrentItem = (field: keyof BillItem, value: any) => {
    const updatedItem = { ...currentItem, [field]: value }
    if (field === "quantity" || field === "salePrice") {
      updatedItem.total = (Number(updatedItem.quantity) || 0) * (Number(updatedItem.salePrice) || 0)
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
    if (!currentItem.purchaseCode.trim()) {
      alert("Please enter purchase code")
      return
    }
    const decoded = decodePurchaseCode(currentItem.purchaseCode)
    if (!decoded.valid) {
      alert("Invalid purchase code")
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

  // Edit bill function
  const editBill = (bill: any) => {
    setEditingBillId(bill.id)
    // Ensure date is in yyyy-mm-dd and items include totals
    setFormData({
      billNumber: bill.billNumber,
      date: new Date(bill.date).toISOString().split("T")[0],
      sellerName: bill.sellerName || "",
      customerName: bill.customer?.name || bill.customerName || "",
      customerMobile: bill.customer?.mobile || bill.customerMobile || "",
      items: (bill.items || []).map((it: any) => ({
        productName: it.product?.name || it.productName || "",
        quantity: Number(it.quantity || 0),
        salePrice: Number(it.salePrice || 0),
        purchaseCode: it.purchaseCode || "",
        total: Number(it.quantity || 0) * Number(it.salePrice || 0),
      })),
      savingBalance: bill.savingBalance || 0,
      cashPayment: bill.cashPayment || 0,
      onlinePayment: bill.onlinePayment || 0,
      borrowedAmount: bill.borrowedAmount || 0,
      remarks: bill.remarks || "",
    })
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete bill function
  const deleteBill = async (billId: string) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      try {
        await deleteBillMutation(`/api/bills/${billId}`, { method: 'DELETE' })
        // Reload bills after deletion
        await loadBills()
        alert('Bill deleted successfully!')
      } catch (error) {
        alert('Failed to delete bill')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerName.trim()) {
      alert("Please enter customer name")
      return
    }

    if (formData.items.length === 0) {
      alert("Please add at least one item")
      return
    }

    setIsSubmitting(true)

    try {
      const billData = {
        billNumber: formData.billNumber,
        date: formData.date,
        customer: {
          name: formData.customerName,
          mobile: formData.customerMobile,
        },
        sellerName: formData.sellerName,
        items: formData.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          salePrice: item.salePrice,
          purchaseCode: item.purchaseCode,
        })),
        savingBalance: formData.savingBalance,
        cashPayment: formData.cashPayment,
        onlinePayment: formData.onlinePayment,
        borrowedAmount: formData.borrowedAmount,
        remarks: formData.remarks,
      }

      if (editingBillId) {
        await mutateBill(`/api/bills/${editingBillId}`, { method: 'PUT', body: billData })
      } else {
        await createBill('/api/bills', { body: billData })
      }

      // Reset form
      setFormData({
        billNumber: editingBillId ? formData.billNumber : (Number.parseInt(formData.billNumber) + 1).toString(),
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
      setEditingBillId(null)

      // Reload bills
      await loadBills()
      
      alert(editingBillId ? "Bill updated successfully!" : "Bill saved successfully!")
    } catch (error: any) {
      alert(`Failed to save bill: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const decodedInfo = decodePurchaseCode(currentItem.purchaseCode)
  const fmt = (n: number) => `₹${Number(n || 0).toFixed(2)}`
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Billing System</h2>
        <p className="text-gray-600">Create and manage customer bills</p>
      </div>

      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
              <div className="sm:col-span-2 lg:col-span-1">
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

              {/* Purchase Code: text input + live decode */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus uppercase"
                  value={currentItem.purchaseCode}
                  onChange={(e) => updateCurrentItem("purchaseCode", e.target.value.toUpperCase())}
                  placeholder="e.g., DIN"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {decodedInfo.valid ? (
                      <></>
                    ) : currentItem.purchaseCode ? (
                      <span className="text-red-500">Invalid code</span>
                    ) : (
                      ""
                    )}
                  </p>
                  {/* {decodedInfo.valid && (
                    <button
                      type="button"
                      onClick={() => updateCurrentItem("salePrice", decodedInfo.value)}
                      className="text-xs mt-1 sm:mt-0 underline text-blue-600"
                    >
                      Use as Sale Price
                    </button>
                  )} */}
                </div>
              </div>

              <div className="flex items-center mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Add Item
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Code
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.length > 0 ? (
                    formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.purchaseCode}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{item.salePrice.toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{item.total.toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
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
                      <td colSpan={6} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xl font-bold mb-4">
              <span>Total Amount:</span>
              <span className="text-blue-600 mt-2 sm:mt-0">₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (editingBillId ? "Updating..." : "Saving...") : (editingBillId ? "Update Bill" : "Save Bill")}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-white rounded-lg card-shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h3 className="text-lg font-semibold mb-2 sm:mb-0">Recent Bills</h3>
          
          {/* Download Buttons */}
          {bills.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  const data = bills.map(bill => ({
                    billNumber: bill.billNumber,
                    date: new Date(bill.date).toLocaleDateString("en-IN"),
                    customer: bill.customer?.name || bill.customerName || "N/A",
                    mobile: bill.customer?.mobile || bill.customerMobile || "N/A",
                    items: (bill.items || []).map((item: any) => 
                      `${item.product?.name || item.productName} (Qty: ${item.quantity})`
                    ).join(", "),
                    remarks: bill.customer?.remarks || bill.remarks || "N/A",
                    totalAmount: bill.totalAmount
                  }))
                  
                  exportToPDF({
                    title: "Billing Report",
                    dateRange: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
                    columns: ["billNumber", "date", "customer", "mobile", "items", "remarks", "totalAmount"],
                    data,
                    columnLabels: ["Bill #", "Date", "Customer", "Mobile", "Items", "Remarks", "Total Amount"],
                    currencyColumns: ["totalAmount"],
                    orientation: 'landscape'
                  })
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => {
                  const data = bills.map(bill => ({
                    billNumber: bill.billNumber,
                    date: new Date(bill.date).toLocaleDateString("en-IN"),
                    customer: bill.customer?.name || bill.customerName || "N/A",
                    mobile: bill.customer?.mobile || bill.customerMobile || "N/A",
                    items: (bill.items || []).map((item: any) => 
                      `${item.product?.name || item.productName} (Qty: ${item.quantity})`
                    ).join(", "),
                    remarks: bill.customer?.remarks || bill.remarks || "N/A",
                    totalAmount: bill.totalAmount
                  }))
                  
                  exportToExcel({
                    title: "Billing Report",
                    dateRange: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
                    columns: ["billNumber", "date", "customer", "mobile", "items", "remarks", "totalAmount"],
                    data,
                    columnLabels: ["Bill #", "Date", "Customer", "Mobile", "Items", "Remarks", "Total Amount"],
                    currencyColumns: ["totalAmount"]
                  })
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                📊 Download Excel
              </button>
            </div>
          )}
        </div>
        {billsLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading bills...</div>
          </div>
        ) : bills.length > 0 ? (
          <>
            {/* Mobile Card View */}
              <div className="block lg:hidden space-y-4">
                {bills.map((bill, index) => {
                  const money = (n: number) => `₹${Number(n || 0).toFixed(2)}`; // tiny helper

                  return (
                    <div
                      key={bill.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                    >
                      {/* Header */}
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

                      {/* Customer & Seller */}
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">Customer</div>
                          <div className="text-sm font-semibold text-gray-800">
                            {bill.customer?.name || bill.customerName}
                          </div>
                        </div>
                        {(bill.customer?.mobile || bill.customerMobile) && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">Mobile</div>
                            <div className="text-sm font-medium text-blue-600">
                              {bill.customer?.mobile || bill.customerMobile}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">Seller</div>
                          <div className="text-sm font-medium text-gray-800">
                            {bill.sellerName || "N/A"}
                          </div>
                        </div>
                      </div>

                      {/* Items (clean: name, qty, unit, subtotal) */}
                      <div className="mt-4">
                        <div className="text-sm font-medium text-gray-600 mb-2">Items</div>
                        <ul className="space-y-2">
                          {(bill.items || []).map((item: any, idx: number) => {
                            const qty = Number(item.quantity || 0);
                            const unit = Number(item.salePrice || 0);
                            const subtotal = qty * unit;

                            return (
                              <li
                                key={idx}
                                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                              >
                                <div className="flex items-baseline justify-between gap-3">
                                  <div className="font-medium text-gray-800 truncate">
                                    {item.product?.name || item.productName}
                                    <span className="ml-2 text-xs text-gray-500">
                                      (Qty: {qty})
                                    </span>
                                  </div>
                                  <div className="tabular-nums font-mono text-sm font-semibold text-gray-900">
                                    {money(subtotal)}
                                  </div>
                                </div>
                                <div className="mt-1 text-[12px] text-gray-600">
                                  {money(unit)} <span className="text-gray-400">×</span> {qty}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Payments summary */}
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

                      {/* Remarks (optional) */}
                      {bill.remarks ? (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-500 mb-1">Remarks</div>
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {bill.remarks}
                          </div>
                        </div>
                      ) : null}

                      {/* Total */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                          <div className="text-sm font-medium text-emerald-700">Total Amount</div>
                          <div className="text-lg font-bold tabular-nums font-mono text-emerald-700">
                            {money(bill.totalAmount)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => editBill(bill)}
                          className="flex-1 px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium active:scale-[0.99] hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteBill(bill.id)}
                          className="flex-1 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium active:scale-[0.99] hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>


            {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-[1100px] w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ser No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bill No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name of Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mob No of Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cash</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Online</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Borrow</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Seller</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Remarks</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-100">
                    {bills.map((bill, index) => {
                      const itemsTotal = (bill.items || []).reduce((sum: number, it: any) => {
                        const qty = Number(it.quantity || 0)
                        const unit = Number(it.salePrice || 0)
                        return sum + qty * unit
                      }, 0)

                      return (
                        <tr key={bill.id} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{bill.billNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(bill.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{bill.customer?.name || bill.customerName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{bill.customer?.mobile || bill.customerMobile || "N/A"}</td>

                          {/* ITEMS (no code/profit) */}
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="space-y-2">
                              {(bill.items || []).map((item: any, idx: number) => {
                                const name = item.product?.name || item.productName
                                const qty = Number(item.quantity || 0)
                                const unit = Number(item.salePrice || 0)
                                const sub = qty * unit
                                return (
                                  <div key={idx} className="rounded-md border border-gray-200 bg-gray-50 p-2.5">
                                    <div className="flex items-baseline justify-between gap-3">
                                      <div className="font-medium truncate">{name}</div>
                                      <div className="tabular-nums font-mono text-gray-800">{fmt(sub)}</div>
                                    </div>
                                    <div className="mt-1 text-[12px] text-gray-600">
                                      {fmt(unit)} <span className="text-gray-400">×</span> {qty}
                                    </div>
                                  </div>
                                )
                              })}

                              {/* Items total (optional, matches right-side Total usually) */}
                              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2 text-[12px] font-semibold">
                                <span className="text-gray-600">Items Total</span>
                                <span className="tabular-nums font-mono">{fmt(itemsTotal)}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-sm text-right tabular-nums font-mono text-gray-900">
                            {fmt(bill.cashPayment)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right tabular-nums font-mono text-gray-900">
                            {fmt(bill.onlinePayment)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right tabular-nums font-mono text-gray-900">
                            {fmt(bill.borrowedAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{bill.sellerName || "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{bill.remarks || "N/A"}</td>

                          {/* Bill grand total */}
                          <td className="px-4 py-3 text-sm text-right tabular-nums font-mono font-semibold text-gray-900">
                            {fmt(bill.totalAmount ?? itemsTotal)}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex gap-2">
                              <button
                                onClick={() => editBill(bill)}
                                className="px-3 py-1.5 rounded bg-blue-500 text-white text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBill(bill.id)}
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
              </div>

          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500">No bills found. Create your first bill above.</div>
          </div>
        )}
      </div>
    </div>
  )
}
