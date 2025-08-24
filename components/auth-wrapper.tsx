"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Header from "./header"
import Sidebar from "./sidebar"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

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

    // Restrict worker access to only billing page
    if (isAuthenticated && user?.role === "WORKER" && pathname !== "/billing") {
      router.push("/billing")
      return
    }
  }, [isAuthenticated, pathname, router, user, isLoading])

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
      <Header />
      <Sidebar />
      <main className="pl-0 lg:ml-64 min-h-screen bg-gray-50">
        <div className="p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  )
}
