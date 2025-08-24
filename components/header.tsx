"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"

interface HeaderProps {
  onMobileMenuToggle: () => void
  isMobileMenuOpen: boolean
}

export default function Header({ onMobileMenuToggle, isMobileMenuOpen }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState("")
  const { user, logout } = useAuth()
  const router = useRouter()

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

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 gradient-bg text-white shadow-lg header-shadow">
      <div className="mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm sm:text-lg">SK</span>
            </div>
            <div className="ml-2 sm:ml-3">
              <h1 className="text-base sm:text-lg md:text-2xl font-bold">Shree Krishna Handloom</h1>
              <p className="text-purple-100 text-xs sm:text-sm">Management System</p>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            id="mobile-toggle"
            className="lg:hidden p-2 rounded-md text-white hover:bg-white/20 transition-colors"
            onClick={() => {
              console.log('Header button clicked!')
              onMobileMenuToggle()
            }}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Temporary test button - remove this later */}
          {/* <button
            className="lg:hidden ml-2 p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
            onClick={() => {
              console.log('Test button clicked!')
              onMobileMenuToggle()
            }}
          >
            TEST
          </button> */}

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center space-x-4 lg:space-x-6">
            <div className="text-right">
              <p className="text-sm text-purple-100">Today's Date</p>
              <p className="font-semibold text-sm lg:text-base">{currentDate}</p>
            </div>

            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="text-right">
                <p className="text-sm text-purple-100">Logged in as</p>
                <p className="font-semibold capitalize text-sm lg:text-base">
                  {user?.role?.toLowerCase()} - {user?.username}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-3 lg:px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
