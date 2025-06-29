"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
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
  Clock,
  Tag,
} from "lucide-react"
import type { NavigationItem } from "@/lib/navigation-config"

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

export function Sidebar() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [navigation, setNavigation] = useState<NavigationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load navigation from API
  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/navigation")
        if (!response.ok) {
          throw new Error("Failed to fetch navigation")
        }
        const data = await response.json()
        setNavigation(data.navigation)

        // Auto-expand all folders by default
        const expandedFolders = extractFolderIds(data.navigation)
        setExpandedSections(expandedFolders)

        setError(null)
      } catch (err) {
        console.error("Error fetching navigation:", err)
        setError("Failed to load navigation")
        setNavigation([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNavigation()
  }, [])

  // Extract all folder IDs for auto-expansion
  const extractFolderIds = (items: NavigationItem[]): string[] => {
    const folderIds: string[] = []

    const traverse = (navItems: NavigationItem[]) => {
      navItems.forEach((item) => {
        if (item.type === "folder") {
          folderIds.push(item.id)
          if (item.children) {
            traverse(item.children)
          }
        }
      })
    }

    traverse(items)
    return folderIds
  }

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const searchContent = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(`/api/navigation/search?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    }
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

  // Recursive component to render navigation items
  const NavigationItem = ({ item, level = 0 }: { item: NavigationItem; level?: number }) => {
    const IconComponent = iconMap[item.icon as keyof typeof iconMap] || FileText

    if (item.type === "folder") {
      return (
        <div key={item.id} style={{ marginLeft: `${level * 12}px` }}>
          <Button
            variant="ghost"
            className="w-full justify-between p-2 h-auto font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => toggleSection(item.id)}
          >
            <div className="flex items-center">
              <IconComponent className="w-4 h-4 mr-2" />
              {item.title}
            </div>
            {expandedSections.includes(item.id) ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>

          {expandedSections.includes(item.id) && item.children && (
            <div className="mt-1 space-y-1">
              {item.children
                .filter((child) => child.visible !== false)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((subItem, index) => (
                  <NavigationItem key={`${subItem.id}-${index}`} item={subItem} level={level + 1} />
                ))}
            </div>
          )}
        </div>
      )
    } else if (item.type === "file") {
      const isActive = pathname === item.href

      return (
        <Link key={item.href} href={item.href || "#"}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start p-2 h-auto text-sm",
              isActive
                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600 dark:border-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800",
            )}
            style={{ marginLeft: `${level * 12}px` }}
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="flex items-center w-full">
              <IconComponent className="w-4 h-4 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{item.title}</div>
                {item.metadata && (
                  <div className="flex items-center space-x-1 mt-1">
                    {item.metadata.difficulty && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {item.metadata.difficulty}
                      </Badge>
                    )}
                    {item.metadata.estimatedReadTime && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {item.metadata.estimatedReadTime}min
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Button>
        </Link>
      )
    }

    return null
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
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
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
                const IconComponent = iconMap[result.metadata?.icon as keyof typeof iconMap] || FileText
                return (
                  <Link key={index} href={result.href || "#"}>
                    <div
                      className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsMobileOpen(false)
                        clearSearch()
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className="w-4 h-4 mt-0.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">{result.title}</div>
                          {result.metadata?.description && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                              {result.metadata.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            {result.metadata?.difficulty && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {result.metadata.difficulty}
                              </Badge>
                            )}
                            {result.metadata?.estimatedReadTime && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                {result.metadata.estimatedReadTime}min
                              </div>
                            )}
                            {result.metadata?.tags && result.metadata.tags.length > 0 && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Tag className="w-3 h-3 mr-1" />
                                {result.metadata.tags.slice(0, 2).join(", ")}
                              </div>
                            )}
                          </div>
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
              {navigation
                .filter((item) => item.visible !== false)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((item, index) => (
                  <NavigationItem key={`${item.id}-${index}`} item={item} />
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
