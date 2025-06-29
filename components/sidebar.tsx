"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Book,
  Users,
  Code,
  Layers,
  Wrench,
  Database,
  ChevronDown,
  ChevronRight,
  Home,
  Search,
  X,
  Folder,
  FileText,
  Loader2,
} from "lucide-react"

// Icon mapping for dynamic icons
const iconMap = {
  Book,
  Users,
  Code,
  Layers,
  Wrench,
  Database,
  Home,
  FileText,
  Folder,
  Search,
}

// Utility function to clean display names by removing numerical prefixes
const cleanDisplayName = (name: string): string => {
  // Remove numerical prefixes like "01_", "02_", etc.
  return name.replace(/^\d+_\s*/, "").trim()
}

interface NavItem {
  title: string
  href?: string
  icon: string
  type: "file" | "folder"
  items?: NavItem[]
}

export function Sidebar() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [navigation, setNavigation] = useState<NavItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpandedAll, setIsExpandedAll] = useState(true)

  // Load navigation from API
  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/docs-structure")
        if (!response.ok) {
          throw new Error("Failed to fetch docs structure")
        }
        const data = await response.json()
        setNavigation(data)

        // Auto-expand all folders by default
        const expandedFolders = extractFolderNames(data)
        setExpandedSections(expandedFolders)
        setIsExpandedAll(true)

        setError(null)
      } catch (err) {
        console.error("Error fetching navigation:", err)
        setError("Failed to load navigation")
        // Fallback to empty navigation
        setNavigation([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNavigation()
  }, [])

  // Extract all folder names for auto-expansion
  const extractFolderNames = (items: NavItem[]): string[] => {
    const folderNames: string[] = []

    const traverse = (navItems: NavItem[]) => {
      navItems.forEach((item) => {
        if (item.type === "folder") {
          folderNames.push(item.title)
          if (item.items) {
            traverse(item.items)
          }
        }
      })
    }

    traverse(items)
    return folderNames
  }

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]))
  }

  const searchContent = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const results: any[] = []
    const queryLower = query.toLowerCase()

    // Recursive function to search through nested navigation
    const searchNavigation = (items: NavItem[], sectionPath: string[] = []) => {
      items.forEach((item) => {
        if (item.type === "folder" && item.items) {
          searchNavigation(item.items, [...sectionPath, item.title])
        } else if (item.type === "file" && item.title.toLowerCase().includes(queryLower)) {
          results.push({
            ...item,
            section: sectionPath.length > 0 ? sectionPath.join(" > ") : "Root",
            type: "navigation",
            snippet: `Found in ${sectionPath.length > 0 ? sectionPath.join(" > ") : "root"} navigation`,
          })
        }
      })
    }

    // Search through navigation items
    searchNavigation(navigation)

    // Remove duplicates and sort by relevance
    const uniqueResults = results.filter(
      (result, index, self) => index === self.findIndex((r) => r.href === result.href),
    )

    // Sort by relevance (exact title matches first)
    uniqueResults.sort((a, b) => {
      const aExact = a.title.toLowerCase() === queryLower
      const bExact = b.title.toLowerCase() === queryLower
      const aStarts = a.title.toLowerCase().startsWith(queryLower)
      const bStarts = b.title.toLowerCase().startsWith(queryLower)

      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.title.localeCompare(b.title)
    })

    setSearchResults(uniqueResults)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    searchContent(query)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setIsSearching(false)
  }

  const toggleExpandAll = () => {
    if (isExpandedAll) {
      // Collapse all
      setExpandedSections([])
      setIsExpandedAll(false)
    } else {
      // Expand all
      const allFolders = extractFolderNames(navigation)
      setExpandedSections(allFolders)
      setIsExpandedAll(true)
    }
  }

  // Recursive component to render navigation items
  const NavigationItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const IconComponent = iconMap[item.icon as keyof typeof iconMap] || FileText
    const displayName = cleanDisplayName(item.title)

    if (item.type === "folder") {
      return (
        <div key={item.title} style={{ marginLeft: `${level * 12}px` }}>
          <Button
            variant="ghost"
            className="w-full justify-between p-2 h-auto font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
            onClick={() => toggleSection(item.title)}
          >
            <div className="flex items-center min-w-0 flex-1">
              <IconComponent className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{displayName}</span>
            </div>
            <div className="flex-shrink-0 ml-2">
              {expandedSections.includes(item.title) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </Button>

          {expandedSections.includes(item.title) && item.items && (
            <div className="mt-1 space-y-1">
              {item.items.map((subItem, index) => (
                <NavigationItem key={`${subItem.title}-${index}`} item={subItem} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      )
    } else {
      // File item
      const isActive = pathname === item.href
      // Construct proper href for markdown files based on folder structure
      const constructHref = (item: NavItem) => {
        if (item.href) return item.href

        // For files, construct the path based on the actual file structure
        // The item.title should contain the full path like "01_GRA_Core_Platform Introduction/introduction.md"
        if (item.title.includes("/")) {
          // Split folder and file
          const parts = item.title.split("/")
          const folderName = parts[0] // e.g., "01_GRA_Core_Platform Introduction"
          const fileName = parts[1].replace(".md", "") // e.g., "introduction"
          return `/docs/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`
        } else {
          // Single file in root
          const fileName = item.title.replace(".md", "")
          return `/docs/${encodeURIComponent(fileName)}`
        }
      }

      const finalHref = constructHref(item)

      return (
        <Link key={item.title} href={finalHref}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start p-2 h-auto text-sm min-w-0",
              isActive
                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600 dark:border-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800",
            )}
            style={{ marginLeft: `${level * 12}px` }}
            onClick={() => setIsMobileOpen(false)}
          >
            <IconComponent className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{displayName}</span>
          </Button>
        </Link>
      )
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation / Search Results */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-2 min-w-0">
          {/* Expand/Collapse All Toggle */}
          {!isSearching && navigation.length > 0 && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={toggleExpandAll}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1"
                style={{
                  backgroundColor: isExpandedAll ? "#f1f5f9" : "#e2e8f0",
                  borderColor: isExpandedAll ? "#cbd5e1" : "#94a3b8",
                  color: isExpandedAll ? "#475569" : "#64748b",
                }}
              >
                {isExpandedAll ? (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3 h-3 mr-1" />
                    Expand All
                  </>
                )}
              </button>
            </div>
          )}
          {isLoading ? (
            // Loading state
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading navigation...</span>
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-8">
              <div className="text-red-500 dark:text-red-400 mb-2">⚠️</div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                Try again
              </button>
            </div>
          ) : isSearching && searchResults.length > 0 ? (
            // Search Results
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Search Results ({searchResults.length})
              </h3>
              {searchResults.map((result, index) => {
                const IconComponent = iconMap[result.icon as keyof typeof iconMap] || Search
                const displayName = cleanDisplayName(result.title)
                // Construct proper href for markdown files
                const href =
                  result.href ||
                  (() => {
                    if (result.title.includes("/")) {
                      const parts = result.title.split("/")
                      const folderName = parts[0]
                      const fileName = parts[1].replace(".md", "")
                      return `/docs/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`
                    } else {
                      const fileName = result.title.replace(".md", "")
                      return `/docs/${encodeURIComponent(fileName)}`
                    }
                  })()
                return (
                  <Link key={index} href={href}>
                    <div
                      className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsMobileOpen(false)
                        clearSearch()
                      }}
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <IconComponent className="w-4 h-4 mt-0.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                            {displayName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">
                            {result.section}
                          </div>
                          {result.snippet && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                              {result.snippet}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : isSearching && searchResults.length === 0 ? (
            // No Results
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No results found for "{searchQuery}"</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Try different keywords or check spelling
              </p>
            </div>
          ) : navigation.length === 0 ? (
            // Empty navigation
            <div className="text-center py-8">
              <Folder className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No documentation found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add markdown files to the docs folder</p>
            </div>
          ) : (
            // Default Navigation
            <div className="space-y-1">
              {navigation.map((item, index) => (
                <NavigationItem key={`${item.title}-${index}`} item={item} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-40 pt-16">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Documentation</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
