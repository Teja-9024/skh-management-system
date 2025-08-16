"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<"owner" | "worker">("owner")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simple authentication logic - in real app, this would be server-side
    const validCredentials = {
      owner: { username: "owner", password: "owner123" },
      worker: { username: "worker", password: "worker123" },
    }

    if (username === validCredentials[selectedRole].username && password === validCredentials[selectedRole].password) {
      login(selectedRole, username)
      router.push(selectedRole === "worker" ? "/billing" : "/")
    } else {
      setError("Invalid username or password")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-purple-600 font-bold text-xl">SK</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Shree Krishna Handloom</h1>
          <p className="text-gray-600 mt-2">Management System Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Login As</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole("owner")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedRole === "owner"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">👑</div>
                  <div className="font-medium">Owner</div>
                  <div className="text-xs">Full Access</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("worker")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedRole === "worker"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">👤</div>
                  <div className="font-medium">Worker</div>
                  <div className="text-xs">Billing Only</div>
                </div>
              </button>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={`Enter ${selectedRole} username`}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <div className="mb-2">Demo Credentials:</div>
          <div>Owner: owner / owner123</div>
          <div>Worker: worker / worker123</div>
        </div>
      </div>
    </div>
  )
}
