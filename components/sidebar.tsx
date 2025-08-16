"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

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

  const filteredMenuItems = menuItems.filter((item) => user?.role && item.roles.includes(user.role))

  return (
    <aside className="w-64 bg-white shadow-lg">
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
  )
}
