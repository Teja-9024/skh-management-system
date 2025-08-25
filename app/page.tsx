"use client"

import { useEffect, useRef, useState } from "react"
import { useApi } from "@/hooks/use-api"

export default function Dashboard() {
  const lineChartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)

  const lineChartInstance = useRef<any>(null)
  const pieChartInstance = useRef<any>(null)

  const [dashboardData, setDashboardData] = useState<any>(null)
  const { data, loading, execute: fetchDashboard } = useApi()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await fetchDashboard('/api/reports/dashboard')
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }

   useEffect(() => {
    if (!dashboardData) return

    const loadCharts = async () => {
      const Chart = (await import("chart.js/auto")).default

      // Line Chart - Monthly Sales
      if (lineChartRef.current) {
        const ctx = lineChartRef.current.getContext("2d")
        if (ctx) {
          // destroy old chart if exists
          if (lineChartInstance.current) {
            lineChartInstance.current.destroy()
          }

          const monthlySales = dashboardData.charts?.monthlySales || []
          const labels = monthlySales.map((item: any) => 
            new Date(item.month).toLocaleDateString('en-US', { month: 'short' })
          )
          const data = monthlySales.map((item: any) => item.total || 0)

          lineChartInstance.current = new Chart(ctx, {
            type: "line",
            data: {
              labels: labels.length > 0 ? labels : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
              datasets: [
                {
                  label: "Sales",
                  data: data.length > 0 ? data : [0, 0, 0, 0, 0, 0],
                  borderColor: "#667eea",
                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                  tension: 0.4,
                  fill: true,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: "#f3f4f6" },
                },
                x: {
                  grid: { color: "#f3f4f6" },
                },
              },
            },
          })
        }
      }

      // Pie Chart - Expense Distribution
      if (pieChartRef.current) {
        const ctx = pieChartRef.current.getContext("2d")
        if (ctx) {
          if (pieChartInstance.current) {
            pieChartInstance.current.destroy()
          }

          const expenseDistribution = dashboardData.charts?.expenseDistribution || []
          const labels = expenseDistribution.map((item: any) => 
            item.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())
          )
          const data = expenseDistribution.map((item: any) => item.amount)

          pieChartInstance.current = new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: labels.length > 0 ? labels : ["No Data"],
              datasets: [
                {
                  data: data.length > 0 ? data : [1],
                  backgroundColor: labels.length > 0 ? 
                    ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b"] :
                    ["#e5e7eb"],
                  borderWidth: 0,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    usePointStyle: true,
                    padding: 20,
                  },
                },
              },
            },
          })
        }
      }
    }

    loadCharts()

    // cleanup when component unmounts
    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy()
      if (pieChartInstance.current) pieChartInstance.current.destroy()
    }
  }, [dashboardData])

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome to your business management dashboard</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Loading dashboard...</div>
        </div>
      ) : (
        <>
          {/* Summary Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    ₹{(dashboardData?.summary?.totalSales || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg sm:text-xl">🔥</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Purchase</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">
                    ₹{(dashboardData?.summary?.totalPurchases || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg sm:text-xl">🛒</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Gross Profit</p>
                  <p className={`text-lg sm:text-2xl font-bold ${(dashboardData?.summary?.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(dashboardData?.summary?.grossProfit || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg sm:text-xl">📈</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">
                    ₹{(dashboardData?.summary?.totalExpenses || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg sm:text-xl">💸</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Borrowed Money</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">
                    ₹{(dashboardData?.summary?.totalBorrowed || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-lg sm:text-xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Market Purchase</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">
                    ₹{(dashboardData?.summary?.marketPurchaseValue || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg sm:text-xl">🛍️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Net Outstanding</p>
                  <p className={`text-lg sm:text-2xl font-bold ${(dashboardData?.summary?.netOutstanding || 0) >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    ₹{Math.abs(dashboardData?.summary?.netOutstanding || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 text-lg sm:text-xl">⚖️</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bills</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    {dashboardData?.counts?.bills || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg sm:text-xl">🧾</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Purchases</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">
                    {dashboardData?.counts?.purchases || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg sm:text-xl">📦</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section - Responsive Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Sales Overview</h3>
              <div className="h-64 sm:h-80">
                <canvas ref={lineChartRef}></canvas>
              </div>
            </div>

            <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Expense Distribution</h3>
              <div className="h-64 sm:h-80">
                <canvas ref={pieChartRef}></canvas>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-center">
                <div className="text-2xl mb-2">🧾</div>
                <div className="font-medium">Create Bill</div>
              </button>
              <button className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-center">
                <div className="text-2xl mb-2">🛒</div>
                <div className="font-medium">Record Purchase</div>
              </button>
              <button className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-medium">Money Transaction</div>
              </button>
              <button className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-center">
                <div className="text-2xl mb-2">💸</div>
                <div className="font-medium">Add Expense</div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
