import { type NextRequest, NextResponse } from "next/server"
import { readdir, readFile, stat } from "fs/promises"
import { join } from "path"

interface SearchResult {
  id: string
  title: string
  url: string
  excerpt: string
  content: string
  file_path: string
  category: string
  tags: string[]
  read_time: number
  last_modified: string
  word_count: number
}

// Function to recursively find all markdown files
async function findMarkdownFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = []

  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        const subFiles = await findMarkdownFiles(fullPath, baseDir)
        files.push(...subFiles)
      } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }

  return files
}

// Function to extract plain text from markdown
function markdownToText(markdown: string): string {
  return (
    markdown
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      // Remove headers but keep the text
      .replace(/^#{1,6}\s+/gm, "")
      // Remove links but keep the text
      .replace(/\[([^\]]+)\]$$[^)]+$$/g, "$1")
      // Remove images
      .replace(/!\[[^\]]*\]$$[^)]+$$/g, "")
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      // Remove HTML tags
      .replace(/<[^>]+>/g, "")
      // Clean up whitespace
      .replace(/\s+/g, " ")
      .trim()
  )
}

// Function to calculate reading time
function calculateReadTime(text: string): number {
  const wordsPerMinute = 200
  const wordCount = text.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

// Function to generate URL from file path
function generateUrl(filePath: string): string {
  // Remove the docs/ prefix and file extension
  let url = filePath.replace(/^docs\//, "").replace(/\.(md|mdx)$/, "")

  // Handle index files
  if (url.endsWith("/index")) {
    url = url.replace("/index", "")
  }

  return `/docs/${url}`
}

// Function to extract category from file path
function extractCategory(filePath: string): string {
  const parts = filePath.split("/")
  if (parts.length > 1) {
    // Get the first directory after 'docs'
    const categoryPart = parts[1]
    // Remove number prefixes like "01_", "02_", etc.
    return categoryPart.replace(/^\d+_/, "").replace(/_/g, " ")
  }
  return "General"
}

// Function to extract frontmatter (simple implementation)
function extractFrontmatter(content: string): { data: any; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (match) {
    const frontmatterText = match[1]
    const markdownContent = match[2]

    // Simple YAML parsing (basic implementation)
    const data: any = {}
    frontmatterText.split("\n").forEach((line) => {
      const colonIndex = line.indexOf(":")
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line
          .substring(colonIndex + 1)
          .trim()
          .replace(/^["']|["']$/g, "")
        data[key] = value
      }
    })

    return { data, content: markdownContent }
  }

  return { data: {}, content }
}

// Function to process a single markdown file
async function processMarkdownFile(filePath: string): Promise<SearchResult | null> {
  try {
    const content = await readFile(filePath, "utf-8")
    const { data: frontmatter, content: markdownContent } = extractFrontmatter(content)

    // Extract plain text
    const plainText = markdownToText(markdownContent)

    // Get file stats
    const stats = await stat(filePath)

    // Extract title
    let title = frontmatter.title || ""
    if (!title) {
      // Try to extract from first heading
      const headingMatch = markdownContent.match(/^#\s+(.+)$/m)
      if (headingMatch) {
        title = headingMatch[1].trim()
      } else {
        // Use filename as fallback
        const filename =
          filePath
            .split("/")
            .pop()
            ?.replace(/\.(md|mdx)$/, "") || ""
        title = filename.replace(/-/g, " ").replace(/_/g, " ")
        // Remove number prefixes
        title = title.replace(/^\d+\s+/, "")
        // Capitalize first letter of each word
        title = title.replace(/\b\w/g, (l) => l.toUpperCase())
      }
    }

    // Create excerpt (first 200 characters of plain text)
    const excerpt = plainText.length > 200 ? plainText.substring(0, 200) + "..." : plainText

    // Extract tags
    let tags: string[] = []
    if (frontmatter.tags) {
      if (typeof frontmatter.tags === "string") {
        tags = frontmatter.tags.split(",").map((tag) => tag.trim())
      }
    }

    return {
      id: filePath.replace(/[^a-zA-Z0-9]/g, "_"),
      title,
      url: generateUrl(filePath),
      excerpt,
      content: plainText,
      file_path: filePath,
      category: frontmatter.category || extractCategory(filePath),
      tags,
      read_time: calculateReadTime(plainText),
      last_modified: stats.mtime.toISOString(),
      word_count: plainText.split(/\s+/).length,
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
    return null
  }
}

// Function to search through processed documents
function searchDocuments(documents: SearchResult[], query: string, filters: any = {}): SearchResult[] {
  if (!query.trim()) {
    return documents.slice(0, 20) // Return first 20 if no query
  }

  const queryLower = query.toLowerCase()
  const searchTerms = queryLower.split(/\s+/).filter((term) => term.length > 0)

  // Score and filter documents
  const scoredResults = documents
    .map((doc) => {
      let score = 0
      const titleLower = doc.title.toLowerCase()
      const contentLower = doc.content.toLowerCase()
      const categoryLower = doc.category.toLowerCase()

      // Title scoring (highest weight)
      if (titleLower === queryLower) score += 100
      else if (titleLower.includes(queryLower)) score += 80

      // Individual term scoring in title
      searchTerms.forEach((term) => {
        if (titleLower.includes(term)) score += 40
      })

      // Content scoring
      searchTerms.forEach((term) => {
        const contentMatches = (contentLower.match(new RegExp(term, "g")) || []).length
        score += Math.min(contentMatches * 2, 30)
      })

      // Category scoring
      if (categoryLower.includes(queryLower)) score += 20
      searchTerms.forEach((term) => {
        if (categoryLower.includes(term)) score += 10
      })

      // Tags scoring
      doc.tags.forEach((tag) => {
        const tagLower = tag.toLowerCase()
        if (tagLower.includes(queryLower)) score += 15
        searchTerms.forEach((term) => {
          if (tagLower.includes(term)) score += 8
        })
      })

      return { ...doc, score }
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)

  // Apply filters
  let filteredResults = scoredResults

  if (filters.category) {
    filteredResults = filteredResults.filter((doc) =>
      doc.category.toLowerCase().includes(filters.category.toLowerCase()),
    )
  }

  if (filters.tags) {
    filteredResults = filteredResults.filter((doc) =>
      doc.tags.some((tag) => tag.toLowerCase().includes(filters.tags.toLowerCase())),
    )
  }

  return filteredResults
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 50)
  const category = searchParams.get("category") || ""
  const tags = searchParams.get("tags") || ""

  try {
    // Find all markdown files in the docs directory
    const docsPath = join(process.cwd(), "docs")
    const markdownFiles = await findMarkdownFiles(docsPath)

    // Process all markdown files
    const processedDocs = await Promise.all(markdownFiles.map((file) => processMarkdownFile(file)))

    // Filter out null results
    const validDocs = processedDocs.filter((doc): doc is SearchResult => doc !== null)

    // Perform search
    const searchResults = searchDocuments(validDocs, query, { category, tags })

    // Limit results
    const limitedResults = searchResults.slice(0, limit)

    // Generate suggestions (simple implementation)
    const suggestions: string[] = []
    if (query && limitedResults.length === 0) {
      // Generate suggestions based on available titles
      const titleWords = validDocs.flatMap((doc) => doc.title.toLowerCase().split(/\s+/))
      const uniqueWords = [...new Set(titleWords)]
      suggestions.push(
        ...uniqueWords.filter((word) => word.includes(query.toLowerCase()) && word !== query.toLowerCase()).slice(0, 5),
      )
    }

    // Calculate stats
    const categories = [...new Set(validDocs.map((doc) => doc.category))]
    const allTags = [...new Set(validDocs.flatMap((doc) => doc.tags))]
    const totalWords = validDocs.reduce((sum, doc) => sum + doc.word_count, 0)
    const avgReadTime = validDocs.length > 0 ? totalWords / validDocs.length / 200 : 0

    return NextResponse.json({
      results: limitedResults,
      total: searchResults.length,
      query,
      filters: { category, tags },
      suggestions,
      stats: {
        total_documents: validDocs.length,
        total_words: totalWords,
        average_read_time: Math.round(avgReadTime * 10) / 10,
        categories,
        difficulties: [],
        tags: allTags,
      },
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
        results: [],
        total: 0,
        query,
        suggestions: [],
        stats: {
          total_documents: 0,
          total_words: 0,
          average_read_time: 0,
          categories: [],
          difficulties: [],
          tags: [],
        },
      },
      { status: 500 },
    )
  }
}
