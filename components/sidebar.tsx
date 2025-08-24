"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"

const menuItems = [
  { href: "/", label: "Dashboard", icon: "📊", roles: ["owner"] },
  { href: "/billing", label: "Billing System", icon: "🧾", roles: ["owner", "worker"] },
  { href: "/purchase", label: "Market Purchase", icon: "🛒", roles: ["owner"] },
  { href: "/borrowed", label: "Borrowed Money", icon: "💰", roles: ["owner"] },
  { href: "/expenses", label: "Shop Expenses", icon: "💸", roles: ["owner"] },
  { href: "/reports", label: "Reports & Analysis", icon: "📈", roles: ["owner"] },
]

interface SidebarProps {
  isMobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState("")

  const filteredMenuItems = menuItems.filter((item) =>
    user?.role &&
    item.roles.some(role => role.toLowerCase() === user.role.toLowerCase())
  );

  // Update date
  useEffect(() => {
    const updateDate = () => {
      const now = new Date()
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      )
    }

    updateDate()
    const interval = setInterval(updateDate, 1000 * 60) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg z-40 overflow-y-auto sidebar-scroll">
        <nav className="mt-6">
          {/* Date Display */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Today's Date</p>
              <p className="text-sm font-semibold text-gray-700">{currentDate}</p>
            </div>
          </div>
          
          <div className="px-6 py-3">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Modules</h3>
          </div>
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item flex items-center px-6 py-3 transition-colors duration-200 ${
                  isActive ? "active-tab text-white" : "text-gray-700 hover:text-white"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[45]"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        id="mobile-sidebar"
        className={`lg:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg z-[50] transform transition-transform duration-300 ease-in-out sidebar-scroll ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          visibility: isMobileOpen ? 'visible' : 'hidden',
          display: isMobileOpen ? 'block' : 'block'
        }}
      >
        <nav className="mt-6">
          {/* Date Display */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Today's Date</p>
              <p className="text-sm font-semibold text-gray-700">{currentDate}</p>
            </div>
          </div>
          
          <div className="px-6 py-3">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Modules</h3>
          </div>
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item flex items-center px-6 py-3 transition-colors duration-200 ${
                  isActive ? "active-tab text-white" : "text-gray-700 hover:text-white"
                }`}
                onClick={onMobileClose}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
