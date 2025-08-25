"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Header from "./header"
import Sidebar from "./sidebar"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isLoading) return // Don't redirect while loading

    // Redirect to login if not authenticated and not already on login page
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login")
      return
    }

    // Redirect authenticated users away from login page
    if (isAuthenticated && pathname === "/login") {
      router.push(user?.role === "WORKER" ? "/billing" : "/")
      return
    }

    // Restrict worker access to only billing section
    if (isAuthenticated && user?.role === "WORKER") {
      // Allow any route that starts with /billing (e.g., /billing, /billing/all)
      if (!pathname.startsWith("/billing")) {
        router.push("/billing")
        return
      }
    }
  }, [isAuthenticated, pathname, router, user, isLoading])

  // Simple toggle function
  const toggleMobileMenu = () => {
    console.log('Toggle called, current state:', isMobileMenuOpen)
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu
  const closeMobileMenu = () => {
    console.log('Close called')
    setIsMobileMenuOpen(false)
  }

  // Close menu when route changes
  useEffect(() => {
    closeMobileMenu()
  }, [pathname])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated && pathname === "/login") {
    return <>{children}</>
  }

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <>
      {/* Debug indicator */}
      {/* <div className="fixed top-20 right-4 z-[60] bg-red-500 text-white px-2 py-1 text-xs rounded lg:hidden">
        Menu: {isMobileMenuOpen ? 'OPEN' : 'CLOSED'}
      </div> */}
      
      <Header 
        onMobileMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <Sidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={closeMobileMenu}
      />
      <main className="pl-0 lg:ml-64 min-h-screen bg-gray-50">
        <div className="p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  )
}
