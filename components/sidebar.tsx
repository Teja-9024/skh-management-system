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

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const filteredMenuItems = menuItems.filter((item) =>
    user?.role &&
    item.roles.some(role => role.toLowerCase() === user.role.toLowerCase())
  );

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg z-40 overflow-y-auto sidebar-scroll">
        <nav className="mt-6">
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
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out sidebar-scroll ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <nav className="mt-6">
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
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Menu Toggle Button */}
      <button
        className="lg:hidden fixed bottom-4 right-4 z-50 w-12 h-12 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  )
}
