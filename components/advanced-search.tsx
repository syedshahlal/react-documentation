"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Filter, X, Clock, Tag, User, BookOpen, Loader2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface SearchResult {
  id: number
  file_path: string
  title: string
  content: string
  excerpt: string
  snippet: string
  tags: string[]
  category: string
  difficulty: string
  author: string
  last_modified: string
  word_count: number
  read_time: number
  url: string
  rank: number
}

interface SearchFilters {
  category: string
  difficulty: string
  tags: string
  author: string
}

interface SearchStats {
  total_documents: number
  total_words: number
  average_read_time: number
  categories: string[]
  difficulties: string[]
}

export function AdvancedSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [stats, setStats] = useState<SearchStats | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({
    category: "all",
    difficulty: "all",
    tags: "",
    author: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [total, setTotal] = useState(0)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim() && !Object.values(searchFilters).some((f) => f)) {
      setResults([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "20",
        ...Object.fromEntries(Object.entries(searchFilters).filter(([_, v]) => v)),
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.results || [])
        setSuggestions(data.suggestions || [])
        setStats(data.stats)
        setTotal(data.total || 0)
      } else {
        console.error("Search failed:", data.error)
        setResults([])
        setTotal(0)
      }
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle search input changes with debouncing
  const handleSearchChange = (value: string) => {
    setQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value, filters)
    }, 300)
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    performSearch(query, newFilters)
  }

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = { category: "all", difficulty: "all", tags: "", author: "" }
    setFilters(emptyFilters)
    performSearch(query, emptyFilters)
  }

  // Reindex documents
  const handleReindex = async () => {
    setIsIndexing(true)
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "index" }),
      })

      const data = await response.json()
      if (response.ok) {
        console.log("Reindexing completed:", data.message)
        // Refresh search results
        performSearch(query, filters)
      } else {
        console.error("Reindexing failed:", data.error)
      }
    } catch (error) {
      console.error("Reindexing error:", error)
    } finally {
      setIsIndexing(false)
    }
  }

  // Load initial stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "stats" }),
        })
        const data = await response.json()
        if (response.ok) {
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to load stats:", error)
      }
    }

    loadStats()
  }, [])

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    return text.replace(regex, "<mark>$1</mark>")
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Documentation Search</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleReindex} disabled={isIndexing}>
                {isIndexing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                {isIndexing ? "Indexing..." : "Reindex"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search across all documentation..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => {
                  setQuery("")
                  setResults([])
                  setTotal(0)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Suggestions:</span>
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs bg-transparent"
                  onClick={() => handleSearchChange(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          {/* Filters */}
          {showFilters && stats && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Search Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {stats.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={filters.difficulty} onValueChange={(value) => handleFilterChange("difficulty", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      {stats.difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <Input
                    placeholder="Enter tags..."
                    value={filters.tags}
                    onChange={(e) => handleFilterChange("tags", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Author</label>
                  <Input
                    placeholder="Author name..."
                    value={filters.author}
                    onChange={(e) => handleFilterChange("author", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{stats.total_documents} documents</span>
              <span>{stats.total_words.toLocaleString()} words</span>
              <span>~{stats.average_read_time} min avg read time</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Searching...</span>
        </div>
      )}

      {!isLoading && total > 0 && (
        <div className="text-sm text-muted-foreground mb-4">
          Found {total} result{total !== 1 ? "s" : ""} {query && `for "${query}"`}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* Title and URL */}
                  <div>
                    <Link href={result.url} className="hover:underline">
                      <h3
                        className="text-lg font-semibold text-primary"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(result.title, query),
                        }}
                      />
                    </Link>
                    <p className="text-sm text-muted-foreground">{result.url}</p>
                  </div>

                  {/* Snippet */}
                  <div
                    className="text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: result.snippet || result.excerpt,
                    }}
                  />

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {result.read_time > 0 && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {result.read_time} min read
                      </div>
                    )}

                    {result.word_count > 0 && (
                      <div className="flex items-center">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {result.word_count} words
                      </div>
                    )}

                    {result.author && (
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {result.author}
                      </div>
                    )}

                    {result.difficulty && (
                      <Badge variant="outline" className="text-xs">
                        {result.difficulty}
                      </Badge>
                    )}

                    {result.category && (
                      <Badge variant="secondary" className="text-xs">
                        {result.category}
                      </Badge>
                    )}
                  </div>

                  {/* Tags */}
                  {result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {result.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && query && results.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search terms or filters</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
