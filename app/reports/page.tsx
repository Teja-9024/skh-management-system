"use client"

import { useState } from "react"

interface ReportFilters {
  reportType: string
  fromDate: string
  toDate: string
}

export default function ReportsAnalysis() {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: "All Records",
    fromDate: "",
    toDate: "",
  })

  const [showDropdown, setShowDropdown] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [reportData, setReportData] = useState<any[]>([])

  const reportTypes = ["All Records", "Billing", "Purchase", "Borrowed", "Expenses"]

  const generateReport = () => {
    if (!filters.reportType) {
      alert("Please select a report type")
      return
    }

    // Simulate report generation with sample data
    const sampleData = [
      {
        date: "2024-01-15",
        type: "Sale",
        description: "Handloom Saree - Customer ABC",
        amount: 5500,
        status: "Completed",
      },
      {
        date: "2024-01-14",
        type: "Purchase",
        description: "Raw Cotton - Supplier XYZ",
        amount: 2200,
        status: "Received",
      },
      {
        date: "2024-01-13",
        type: "Expense",
        description: "Electricity Bill",
        amount: 1500,
        status: "Paid",
      },
      {
        date: "2024-01-12",
        type: "Sale",
        description: "Cotton Fabric - Customer DEF",
        amount: 3200,
        status: "Completed",
      },
      {
        date: "2024-01-11",
        type: "Purchase",
        description: "Silk Thread - Supplier ABC",
        amount: 1800,
        status: "Received",
      },
    ]

    // Filter data based on date range if provided
    let filteredData = sampleData
    if (filters.fromDate) {
      filteredData = filteredData.filter((item) => item.date >= filters.fromDate)
    }
    if (filters.toDate) {
      filteredData = filteredData.filter((item) => item.date <= filters.toDate)
    }

    setReportData(filteredData)
    setReportGenerated(true)
    alert(`${filters.reportType} generated successfully!`)
  }

  const reportSummary = reportData.reduce(
    (acc, item) => {
      if (item.type === "Sale") {
        acc.totalSales += item.amount
      } else if (item.type === "Purchase") {
        acc.totalPurchases += item.amount
      } else if (item.type === "Expense") {
        acc.totalExpenses += item.amount
      }
      return acc
    },
    { totalSales: 0, totalPurchases: 0, totalExpenses: 0 },
  )

  const netProfit = reportSummary.totalSales - reportSummary.totalPurchases - reportSummary.totalExpenses

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Reports & Analysis</h2>
        <p className="text-gray-600">Generate detailed reports with filters</p>
      </div>

      <div className="bg-white rounded-lg card-shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                        type === "Purchase" ? "bg-blue-500 text-white" : ""
                      }`}
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
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Results */}
      <div className="bg-white rounded-lg card-shadow p-6">
        {!reportGenerated ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Select filters and click "Generate Report" to view results</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-4">{filters.reportType} Results</h3>

            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : item.status === "Received"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Total Sales</h4>
                <p className="text-2xl font-bold text-green-600">₹{reportSummary.totalSales.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Total Purchases</h4>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{reportSummary.totalPurchases.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Total Expenses</h4>
                <p className="text-2xl font-bold text-red-600">
                  ₹{reportSummary.totalExpenses.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">Net Profit</h4>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{netProfit.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
