"use client"

import { useEffect, useRef } from "react"

export default function Dashboard() {
  const lineChartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)

  const lineChartInstance = useRef<any>(null)
  const pieChartInstance = useRef<any>(null)

   useEffect(() => {
    const loadCharts = async () => {
      const Chart = (await import("chart.js/auto")).default

      // Line Chart
      if (lineChartRef.current) {
        const ctx = lineChartRef.current.getContext("2d")
        if (ctx) {
          // destroy old chart if exists
          if (lineChartInstance.current) {
            lineChartInstance.current.destroy()
          }
          lineChartInstance.current = new Chart(ctx, {
            type: "line",
            data: {
              labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
              datasets: [
                {
                  label: "Sales",
                  data: [12000, 19000, 15000, 25000, 22000, 30000],
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

      // Pie Chart
      if (pieChartRef.current) {
        const ctx = pieChartRef.current.getContext("2d")
        if (ctx) {
          if (pieChartInstance.current) {
            pieChartInstance.current.destroy()
          }
          pieChartInstance.current = new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: ["Rent", "Electricity", "Salary", "Maintenance", "Others"],
              datasets: [
                {
                  data: [30, 25, 20, 15, 10],
                  backgroundColor: ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b"],
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
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome to your business management dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">₹0</p>
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
              <p className="text-2xl font-bold text-blue-600">₹0</p>
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
              <p className="text-2xl font-bold text-purple-600">₹0</p>
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
              <p className="text-2xl font-bold text-red-600">₹0</p>
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
              <p className="text-2xl font-bold text-orange-600">₹0</p>
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
              <p className="text-2xl font-bold text-blue-600">₹0</p>
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
    </div>
  )
}
