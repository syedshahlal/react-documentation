"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronDown, ChevronRight, Search, X, Clock, FileText, Hash } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NavItem {
  title: string
  href?: string
  items?: NavItem[]
  isExpanded?: boolean
}

interface SearchResult {
  id: string
  title: string
  url: string
  excerpt: string
  category: string
  tags: string[]
  read_time: number
  word_count: number
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

const navigation: NavItem[] = [
  {
    title: "GRA Core Platform Introduction",
    items: [{ title: "Introduction", href: "/docs/gcp-5.7/01_GRA_Core_Platform Introduction/introduction" }],
  },
  {
    title: "User Guide",
    items: [
      { title: "User Guide", href: "/docs/gcp-5.7/02_User Guide/user-guide" },
      {
        title: "Local Setup",
        items: [{ title: "Getting Started", href: "/docs/gcp-5.7/02_User Guide/Local_setup/getting-started" }],
      },
    ],
  },
  {
    title: "API Reference",
    items: [{ title: "API Reference", href: "/docs/gcp-5.7/03_API Reference/api-reference" }],
  },
  {
    title: "Examples & Tutorials",
    items: [
      { title: "Basic Setup", href: "/docs/gcp-5.7/04_Examples & Tutorials/basic-setup" },
      { title: "User Authentication", href: "/docs/gcp-5.7/04_Examples & Tutorials/user-authentication" },
      { title: "Data Management", href: "/docs/gcp-5.7/04_Examples & Tutorials/data-management" },
    ],
  },
  {
    title: "Development Guide",
    items: [
      { title: "Security Best Practices", href: "/docs/gcp-5.7/05_Development Guide/security-best-practices" },
      { title: "Performance Optimization", href: "/docs/gcp-5.7/05_Development Guide/performance-optimization" },
      { title: "Advanced Monitoring", href: "/docs/gcp-5.7/05_Development Guide/advanced-monitoring" },
    ],
  },
  {
    title: "GCP Feature InDepth",
    items: [
      { title: "Cloud Functions", href: "/docs/gcp-5.7/06_GCP Feature InDepth/cloud-functions" },
      { title: "Cloud Storage", href: "/docs/gcp-5.7/06_GCP Feature InDepth/cloud-storage" },
    ],
  },
]

function NavItem({ item, level = 0 }: { item: NavItem; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(item.isExpanded || false)
  const pathname = usePathname()
  const hasChildren = item.items && item.items.length > 0
  const isActive = item.href === pathname

  const toggleExpanded = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
          level > 0 && "ml-4",
          isActive && "bg-accent text-accent-foreground font-medium",
          !isActive && "hover:bg-accent/50",
        )}
        onClick={toggleExpanded}
      >
        {hasChildren && (
          <div className="flex-shrink-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        )}
        {item.href ? (
          <Link href={item.href} className="flex-1 truncate">
            {item.title}
          </Link>
        ) : (
          <span className="flex-1 truncate">{item.title}</span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {item.items?.map((subItem, index) => (
            <NavItem key={index} item={subItem} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function SearchResults({ results, onClose }: { results: SearchResult[]; onClose: () => void }) {
  const router = useRouter()

  const handleResultClick = (url: string) => {
    router.push(url)
    onClose()
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No results found</p>
      </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {results.map((result) => (
        <div
          key={result.id}
          className="p-3 hover:bg-accent/50 cursor-pointer border-b border-border/50 last:border-b-0"
          onClick={() => handleResultClick(result.url)}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-sm line-clamp-1">{result.title}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Clock className="h-3 w-3" />
              <span>{result.read_time}m</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{result.excerpt}</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {result.category}
            </Badge>
            {result.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Hash className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("recentSearches")
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Error loading recent searches:", error)
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return

    try {
      const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem("recentSearches", JSON.stringify(updated))
    } catch (error) {
      console.error("Error saving recent search:", error)
    }
  }

  // Debounced search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`)
      const data: SearchResponse = await response.json()

      console.log("Search results:", data)
      setSearchResults(data.results || [])
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    console.log("Search query changed:", query)

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)
  }

  // Handle search submission
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim())
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowResults(false)
    }
  }

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit()
    } else if (e.key === "Escape") {
      setSearchQuery("")
      setSearchResults([])
      setShowResults(false)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
  }

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query)
    performSearch(query)
  }

  return (
    <div className="w-64 h-screen bg-background border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Documentation</h2>
      </div>

      {/* Search Section */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-10 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50">
              {isSearching ? (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Searching...</p>
                </div>
              ) : (
                <>
                  <SearchResults results={searchResults} onClose={() => setShowResults(false)} />
                  {searchResults.length > 0 && (
                    <div className="p-2 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={handleSearchSubmit} className="w-full text-xs">
                        View all results →
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !showResults && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Recent searches:</p>
            <div className="flex flex-wrap gap-1">
              {recentSearches.map((query) => (
                <Button
                  key={query}
                  variant="outline"
                  size="sm"
                  onClick={() => handleRecentSearchClick(query)}
                  className="text-xs h-6 px-2"
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {navigation.map((item, index) => (
            <NavItem key={index} item={item} />
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}

// Export both default and named export for compatibility
export { Sidebar }
