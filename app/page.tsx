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
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome to your business management dashboard</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Loading dashboard...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{(dashboardData?.summary?.totalSales || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">🔥</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchase</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{(dashboardData?.summary?.totalPurchases || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🛒</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                  <p className={`text-2xl font-bold ${(dashboardData?.summary?.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(dashboardData?.summary?.grossProfit || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xl">📈</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{(dashboardData?.summary?.totalExpenses || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">💸</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Borrowed Money</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{(dashboardData?.summary?.totalBorrowed || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Market Purchase Value</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{(dashboardData?.summary?.marketPurchaseValue || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">🛍️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg card-shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Sales Overview</h3>
              <div className="h-64">
                <canvas ref={lineChartRef}></canvas>
              </div>
            </div>

            <div className="bg-white rounded-lg card-shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Expense Distribution</h3>
              <div className="h-64">
                <canvas ref={pieChartRef}></canvas>
              </div>
            </div>
          </div>
        </>
      )}


    </div>
  )
}
