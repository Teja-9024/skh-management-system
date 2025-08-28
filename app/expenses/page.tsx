"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useApi, useApiMutation } from "@/hooks/use-api"

interface ExpenseData {
  date: string
  expenseType: string
  amount: number
  paymentType: string
  expenseCategory: string
  remarks: string
  employeeName?: string
}

export default function ShopExpenses() {
  const [formData, setFormData] = useState<ExpenseData>({
    date: new Date().toISOString().split("T")[0],
    expenseType: "",
    amount: 0,
    paymentType: "CASH",
    expenseCategory: "ELECTRICITY",
    remarks: "",
    employeeName: "",
  })

  const [expenses, setExpenses] = useState<any[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: expensesData, loading: expensesLoading, execute: fetchExpenses } = useApi()
  const { execute: fetchSummary } = useApi()
  const { mutate: createExpense } = useApiMutation()
  const { mutate: updateExpense } = useApiMutation()
  const { mutate: deleteExpenseMutation } = useApiMutation()
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

  const paymentTypes = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE"]
  const expenseCategories = [
    "RENT",
    "ELECTRICITY",
    "WATER",
    "INTERNET",
    "PHONE",
    "TRANSPORTATION",
    "OFFICE_SUPPLIES",
    "MARKETING",
    "MAINTENANCE",
    "INSURANCE",
    "OTHER",
  ]

  useEffect(() => {
    loadExpenses()
    loadSummary()
  }, [])

  const loadExpenses = async () => {
    try {
      const data = await fetchExpenses('/api/expenses?limit=10')
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Failed to load expenses:', error)
    }
  }

  const loadSummary = async () => {
    try {
      const data = await fetchSummary('/api/expenses/summary')
      setTotalExpenses(data.total || 0)
    } catch (error) {
      console.error('Failed to load expense summary:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.expenseType.trim()) {
      alert("Please enter expense type")
      return
    }

    if (formData.amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    const isEmployeeSalary = formData.expenseCategory === 'EMPLOYEE_SALARY'
    if (isEmployeeSalary && !formData.employeeName?.trim()) {
      alert('Please enter employee name for Employee Salary')
      return
    }

    setIsSubmitting(true)

    try {
      const payload: any = {
        date: formData.date,
        expenseType: formData.expenseType,
        amount: formData.amount,
        paymentType: formData.paymentType,
        expenseCategory: formData.expenseCategory,
        remarks: formData.remarks,
      }
      if (isEmployeeSalary) {
        payload.remarks = `Employee: ${formData.employeeName}${payload.remarks ? ` | ${payload.remarks}` : ''}`
      }

      if (editingExpenseId) {
        await updateExpense(`/api/expenses/${editingExpenseId}`, { method: 'PUT', body: payload })
      } else {
        await createExpense('/api/expenses', { body: payload })
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        expenseType: "",
        amount: 0,
        paymentType: "CASH",
        expenseCategory: "ELECTRICITY",
        remarks: "",
        employeeName: "",
      })
      setEditingExpenseId(null)

      // Reload data
      await loadExpenses()
      await loadSummary()
      
      alert(editingExpenseId ? 'Expense updated successfully!' : "Expense saved successfully!")
    } catch (error: any) {
      alert(`Failed to save expense: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit expense function
  const editExpense = (expense: any) => {
    setEditingExpenseId(expense.id)
    const isEmp = expense.expenseCategory === 'EMPLOYEE_SALARY'
    const extractedName = isEmp && typeof expense.remarks === 'string' ? (expense.remarks.match(/Employee:\s*([^|]+)/)?.[1]?.trim() || '') : ''
    setFormData({
      date: new Date(expense.date).toISOString().split('T')[0],
      expenseType: expense.expenseType || "",
      amount: expense.amount || 0,
      paymentType: expense.paymentType || "CASH",
      expenseCategory: expense.expenseCategory || "ELECTRICITY",
      remarks: isEmp ? (expense.remarks?.replace(/Employee:\s*([^|]+)\s*\|?\s*/,'').trim() || "") : (expense.remarks || ""),
      employeeName: extractedName,
    })
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Delete expense function
  const deleteExpense = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpenseMutation(`/api/expenses/${expenseId}`, { method: 'DELETE' })
        // Reload expenses after deletion
        await loadExpenses()
        await loadSummary()
        alert('Expense deleted successfully!')
      } catch (error) {
        alert('Failed to delete expense')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Shop Expenses</h2>
        <p className="text-gray-600">Log all operational expenses</p>
      </div>

      <div className="mb-6 bg-white rounded-lg card-shadow p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Expenses</p>
            <p className="text-lg sm:text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString("en-IN")}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-lg sm:text-xl">💸</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.expenseType}
                onChange={(e) => setFormData((prev) => ({ ...prev, expenseType: e.target.value }))}
                placeholder="e.g., Rent, Light Bill"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.paymentType}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentType: e.target.value }))}
              >
                <option value="">Select payment type</option>
                {paymentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expense Category</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.expenseCategory}
                onChange={(e) => setFormData((prev) => ({ ...prev, expenseCategory: e.target.value }))}
              >
                <option value="">Select category</option>
                {[...expenseCategories, 'EMPLOYEE_SALARY'].map((category) => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            {formData.expenseCategory === 'EMPLOYEE_SALARY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                  value={formData.employeeName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, employeeName: e.target.value }))}
                  placeholder="Enter employee name"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
              rows={4}
              value={formData.remarks}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
              placeholder="Enter any remarks"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (editingExpenseId ? 'Updating...' : "Saving...") : (editingExpenseId ? 'Update Expense' : "Save Expense")}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Expenses */}
      <div className="mt-8 bg-white rounded-lg card-shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
        {expensesLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading expenses...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expense Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.expenseType}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(expense.expenseCategory || "").replace('_', ' ')}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{expense.remarks}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{(expense.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {(expense.paymentType || "").replace('_', ' ').toLowerCase()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editExpense(expense)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500">
                      No expenses recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
