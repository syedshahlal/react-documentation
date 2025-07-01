"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, Search, FileText, Folder, FolderOpen, X, Clock, ArrowRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DocItem {
  title: string
  path: string
  children?: DocItem[]
}

interface SearchResult {
  id: string
  title: string
  url: string
  excerpt: string
  file_path: string
  category: string
  tags: string[]
  read_time: number
  relevance_score: number
}

interface SidebarProps {
  className?: string
}

function Sidebar({ className }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [docStructure, setDocStructure] = useState<DocItem[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("recent-searches")
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to parse recent searches:", e)
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim() || recentSearches.includes(query)) return

    const updated = [query, ...recentSearches.slice(0, 4)]
    setRecentSearches(updated)
    try {
      localStorage.setItem("recent-searches", JSON.stringify(updated))
    } catch (e) {
      console.error("Failed to save recent searches:", e)
    }
  }

  // Load document structure
  useEffect(() => {
    fetch("/api/docs-structure")
      .then((res) => res.json())
      .then((data) => {
        setDocStructure(data)
        const pathsToExpand = new Set<string>()
        const findAndExpandPath = (items: DocItem[], currentPath: string) => {
          items.forEach((item) => {
            if (currentPath.startsWith(item.path)) {
              pathsToExpand.add(item.path)
              if (item.children) {
                findAndExpandPath(item.children, currentPath)
              }
            }
          })
        }
        findAndExpandPath(data, pathname)
        setExpandedItems(pathsToExpand)
      })
      .catch(console.error)
  }, [pathname])

  // Debounced search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`)
      const data = await response.json()

      if (response.ok && data.results) {
        const scoredResults = data.results
          .map((result: any) => ({
            ...result,
            relevance_score: calculateRelevanceScore(result, query),
          }))
          .sort((a: any, b: any) => b.relevance_score - a.relevance_score)

        setSearchResults(scoredResults)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Calculate relevance score for search results
  const calculateRelevanceScore = (result: any, query: string): number => {
    const queryLower = query.toLowerCase()
    const titleLower = result.title.toLowerCase()
    const contentLower = result.content?.toLowerCase() || ""

    let score = 0

    if (titleLower === queryLower) score += 100
    else if (titleLower.startsWith(queryLower)) score += 80
    else if (titleLower.includes(queryLower)) score += 60

    const contentMatches = (contentLower.match(new RegExp(queryLower, "g")) || []).length
    score += Math.min(contentMatches * 5, 40)

    if (result.category && result.category.toLowerCase().includes(queryLower)) score += 20

    if (result.tags && result.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))) score += 15

    return score
  }

  // Handle search input changes with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedItems(newExpanded)
  }

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      saveRecentSearch(query.trim())
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSearchResults([])
    setShowSearchResults(false)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  const filterItems = (items: DocItem[], term: string): DocItem[] => {
    if (!term) return items

    return items.reduce((filtered: DocItem[], item) => {
      const matchesTitle = item.title.toLowerCase().includes(term.toLowerCase())
      const filteredChildren = item.children ? filterItems(item.children, term) : []

      if (matchesTitle || filteredChildren.length > 0) {
        filtered.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : item.children,
        })
      }

      return filtered
    }, [])
  }

  const renderDocItem = (item: DocItem, level = 0) => {
    const isExpanded = expandedItems.has(item.path)
    const isActive = pathname === item.path
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.path}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
            isActive && "bg-accent text-accent-foreground font-medium",
            level > 0 && "ml-4",
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpanded(item.path)} className="flex items-center gap-1 flex-1 text-left">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="truncate">{item.title}</span>
            </button>
          ) : (
            <Link href={item.path} className="flex items-center gap-2 flex-1">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">{item.children!.map((child) => renderDocItem(child, level + 1))}</div>
        )}
      </div>
    )
  }

  const filteredStructure = showSearchResults ? [] : filterItems(docStructure, searchTerm)

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      {/* Enhanced Search Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search across all documentation..."
              value={searchTerm}
              onChange={(e) => {
                console.log("Search input changed:", e.target.value)
                setSearchTerm(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSearchSubmit(searchTerm)
                }
                if (e.key === "Escape") {
                  e.preventDefault()
                  clearSearch()
                }
              }}
              className="w-full pl-10 pr-10 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              autoComplete="off"
              spellCheck="false"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                type="button"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Search Status */}
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span>Searching...</span>
            </div>
          )}

          {/* Recent Searches */}
          {!searchTerm && !showSearchResults && recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Searches</div>
              <div className="flex flex-wrap gap-1">
                {recentSearches.map((recent, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm(recent)}
                    className="h-6 px-2 text-xs"
                    type="button"
                  >
                    {recent}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Search Results */}
        {showSearchResults && (
          <div className="p-4 space-y-4">
            {searchResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearchSubmit(searchTerm)}
                    className="text-xs"
                    type="button"
                  >
                    View all <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <Link
                          href={result.url}
                          className="block space-y-2"
                          onClick={() => saveRecentSearch(searchTerm)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm leading-tight line-clamp-2">
                              {highlightText(result.title, searchTerm)}
                            </h4>
                            {result.read_time && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                <span>{result.read_time}m</span>
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                            {highlightText(result.excerpt, searchTerm)}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {result.category && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  {result.category}
                                </Badge>
                              )}
                              {result.tags?.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.file_path.split("/").pop()?.replace(".md", "")}
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : searchTerm && !isSearching ? (
              <div className="text-center py-8 space-y-3">
                <div className="text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No results found for "{searchTerm}"</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearchSubmit(searchTerm)}
                  className="text-xs"
                  type="button"
                >
                  Search all documentation <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {/* Navigation Tree */}
        {!showSearchResults && (
          <div className="p-4 space-y-1">
            {filteredStructure.length > 0 ? (
              filteredStructure.map((item) => renderDocItem(item))
            ) : searchTerm ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No navigation items match "{searchTerm}"</p>
              </div>
            ) : (
              docStructure.map((item) => renderDocItem(item))
            )}
          </div>
        )}
      </ScrollArea>

      {/* Search Tips Footer */}
      {searchTerm && (
        <div className="p-4 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 text-xs bg-background border rounded">Enter</kbd>
              <span>Full search</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 text-xs bg-background border rounded">Esc</kbd>
              <span>Clear search</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export both default and named exports
export default Sidebar
export { Sidebar }
