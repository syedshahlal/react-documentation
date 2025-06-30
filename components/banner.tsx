"use client"

import { useState } from "react"
import { X } from "lucide-react"

export function Banner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-center text-sm relative">
      <div className="flex items-center justify-center space-x-2">
        <span>🎉</span>
        <span>
          <strong>New:</strong> GRA Core Platform v5.7 is now available with enhanced performance and new features!
        </span>
        <a href="/docs/changelog" className="underline hover:no-underline">
          Learn more
        </a>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:bg-white/20 rounded-full p-1 transition-colors"
        aria-label="Close banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
