import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import AuthWrapper from "@/components/auth-wrapper"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Shree Krishna Handloom - Management System",
  description: "Complete management system for handloom business",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <AuthProvider>
          <AuthWrapper>{children}</AuthWrapper>
          <Toaster richColors  expand={true} position="top-center" />
        </AuthProvider>
      </body>
    </html>
  )
}
