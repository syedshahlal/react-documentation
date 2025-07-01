"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, X, Clock, Tag, User, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  filters: Record<string, string>
  suggestions: string[]
  stats: {
    total_documents: number
    total_words: number
    average_read_time: number
    categories: string[]
    difficulties: string[]
  }
}

interface AdvancedSearchProps {
  initialQuery?: string
  onResultClick?: (result: SearchResult) => void
  compact?: boolean
}

export default function AdvancedSearch({ initialQuery = "", onResultClick, compact = false }: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: "all",
    difficulty: "all",
    tags: "",
    author: "",
  })
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [stats, setStats] = useState<SearchResponse["stats"] | null>(null)
  const [total, setTotal] = useState(0)

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const performSearch = useCallback(async (searchQuery: string, searchFilters: typeof filters) => {
    if (!searchQuery.trim() && !Object.values(searchFilters).some((v) => v !== "all")) {
      setResults([])
      setTotal(0)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...Object.fromEntries(Object.entries(searchFilters).filter(([_, v]) => v !== "all")),
      })

      const response = await fetch(`/api/search?${params}`)
      const data: SearchResponse = await response.json()

      if (response.ok) {
        setResults(data.results)
        setTotal(data.total)
        setSuggestions(data.suggestions)
        setStats(data.stats)
      } else {
        console.error("Search error:", data)
        setResults([])
        setTotal(0)
      }
    } catch (error) {
      console.error("Search request failed:", error)
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchFilters: typeof filters) => {
      performSearch(searchQuery, searchFilters)
    }, 300),
    [performSearch],
  )

  useEffect(() => {
    debouncedSearch(query, filters)
  }, [query, filters, debouncedSearch])

  const clearFilters = () => {
    setFilters({
      category: "all",
      difficulty: "all",
      tags: "",
      author: "",
    })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "all")

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (compact) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {loading && <div className="mt-2 text-sm text-gray-500">Searching...</div>}

        {results.length > 0 && (
          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {results.slice(0, 5).map((result) => (
              <Link
                key={result.id}
                href={result.url}
                className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <div className="font-medium text-sm">{result.title}</div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">{result.excerpt}</div>
              </Link>
            ))}
            {results.length > 5 && (
              <div className="text-center py-2">
                <Button variant="outline" size="sm">
                  View all {total} results
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search across all documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-4 h-12 text-lg"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {Object.values(filters).filter((v) => v !== "all").length}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          {total > 0 && (
            <div className="text-sm text-gray-600">
              {total} result{total !== 1 ? "s" : ""} found
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any category</SelectItem>
                      {stats?.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <Select
                    value={filters.difficulty}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any difficulty</SelectItem>
                      {stats?.difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <Input
                    type="text"
                    placeholder="Enter tags..."
                    value={filters.tags}
                    onChange={(e) => setFilters((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Author</label>
                  <Input
                    type="text"
                    placeholder="Author name..."
                    value={filters.author}
                    onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      )}

      {/* Search Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Link
                      href={result.url}
                      className="text-xl font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      {result.title}
                    </Link>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{result.read_time} min read</span>
                    </div>
                  </div>

                  <div className="text-gray-700 leading-relaxed">{result.snippet || result.excerpt}</div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {result.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {result.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {result.difficulty && (
                        <Badge className={`text-xs ${getDifficultyColor(result.difficulty)}`}>
                          {result.difficulty}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {result.author && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{result.author}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{result.word_count} words</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Did you mean:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <Button key={suggestion} variant="outline" size="sm" onClick={() => setQuery(suggestion)}>
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && !loading && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total_documents}</div>
                <div className="text-sm text-gray-600">Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.total_words.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Words</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.average_read_time}m</div>
                <div className="text-sm text-gray-600">Avg Read Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.categories.length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
