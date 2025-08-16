"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Header from "./header"
import Sidebar from "./sidebar"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated and not already on login page
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login")
      return
    }

    // Redirect authenticated users away from login page
    if (isAuthenticated && pathname === "/login") {
      router.push(user?.role === "worker" ? "/billing" : "/")
      return
    }

    // Restrict worker access to only billing page
    if (isAuthenticated && user?.role === "worker" && pathname !== "/billing") {
      router.push("/billing")
      return
    }
  }, [isAuthenticated, pathname, router, user])

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
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </>
  )
}
