"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

const Sidebar = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
          const data = await response.json()
          setSearchResults(data.results || [])
        } catch (error) {
          console.error("Search failed:", error)
          setSearchResults([])
        }
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-900 p-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search docs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-4 space-y-1 max-h-64 overflow-y-auto">
          <div className="text-xs font-medium text-slate-500 px-2 py-1">Search Results ({searchResults.length})</div>
          {searchResults.map((result) => (
            <Link
              key={result.id}
              href={result.url}
              className="block px-2 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="font-medium truncate">{result.title}</div>
              <div className="text-xs text-slate-500 truncate mt-1">{result.excerpt}</div>
            </Link>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(searchQuery)}`}
            className="block px-2 py-2 text-xs text-blue-600 hover:text-blue-800 text-center border-t border-slate-200 dark:border-slate-700"
          >
            View all results →
          </Link>
        </div>
      )}

      {/* Example Links */}
      <div className="mt-6">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Navigation</h2>
        <ul>
          <li>
            <Link
              href="/"
              className="block py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className="block py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              className="block py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
export { Sidebar }
