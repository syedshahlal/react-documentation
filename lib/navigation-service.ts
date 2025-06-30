import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"
import { type NavigationConfig, type NavigationItem, defaultNavigationConfig } from "./navigation-config"

export interface DocumentMetadata {
  title?: string
  description?: string
  tags?: string[]
  category?: string
  difficulty?: "beginner" | "intermediate" | "advanced"
  estimatedReadTime?: number
  lastUpdated?: string
  author?: string
  version?: string
  relatedDocs?: string[]
  prerequisites?: string[]
  nextSteps?: string[]
}

export interface ProcessedDocument {
  id: string
  title: string
  content: string
  metadata: DocumentMetadata
  filePath: string
  href: string
  lastModified: Date
  wordCount: number
  headings: Array<{
    level: number
    text: string
    id: string
  }>
  links: Array<{
    type: "internal" | "external"
    href: string
    text: string
  }>
}

export class NavigationService {
  private config: NavigationConfig = defaultNavigationConfig
  private documentsCache: Map<string, any> = new Map()
  private navigationCache: NavigationItem[] = []
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      // Try to load custom navigation config
      const configPath = path.join(process.cwd(), "navigation.config.json")
      try {
        const configFile = await fs.readFile(configPath, "utf8")
        this.config = { ...defaultNavigationConfig, ...JSON.parse(configFile) }
      } catch {
        // Use default config if file doesn't exist
        console.log("Using default navigation configuration")
      }

      // Scan and process documents
      await this.scanDocuments()
      this.initialized = true
    } catch (error) {
      console.error("Failed to initialize NavigationService:", error)
      throw error
    }
  }

  private async scanDocuments() {
    const docsPath = path.join(process.cwd(), "docs")

    try {
      await this.scanDirectory(docsPath, "")
    } catch (error) {
      console.error("Error scanning documents:", error)
    }
  }

  private async scanDirectory(dirPath: string, relativePath: string) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const entryRelativePath = path.join(relativePath, entry.name)

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, entryRelativePath)
        } else if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
          await this.processDocument(fullPath, entryRelativePath)
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error)
    }
  }

  private async processDocument(filePath: string, relativePath: string) {
    try {
      const content = await fs.readFile(filePath, "utf8")
      const { data: frontmatter, content: markdownContent } = matter(content)

      // Calculate metadata
      const wordCount = markdownContent.split(/\s+/).length
      const estimatedReadTime = Math.ceil(wordCount / 200)

      // Extract headings for table of contents
      const headings = this.extractHeadings(markdownContent)

      const documentData = {
        filePath: relativePath,
        fullPath: filePath,
        frontmatter,
        content: markdownContent,
        wordCount,
        estimatedReadTime,
        headings,
        lastModified: (await fs.stat(filePath)).mtime,
      }

      this.documentsCache.set(relativePath, documentData)
    } catch (error) {
      console.error(`Error processing document ${filePath}:`, error)
    }
  }

  private extractHeadings(content: string): Array<{ level: number; text: string; id: string }> {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const headings: Array<{ level: number; text: string; id: string }> = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")

      headings.push({ level, text, id })
    }

    return headings
  }

  getNavigation(): NavigationItem[] {
    return this.config.navigation
  }

  findItemBySlug(slug: string): NavigationItem | null {
    const findInItems = (items: NavigationItem[]): NavigationItem | null => {
      for (const item of items) {
        // Check if this item matches the slug
        if (item.href === `/docs/${slug}` || item.id === slug) {
          return item
        }

        // Check children recursively
        if (item.children) {
          const found = findInItems(item.children)
          if (found) return found
        }
      }
      return null
    }

    return findInItems(this.config.navigation)
  }

  getFlatNavigationItems(): NavigationItem[] {
    const flattenItems = (items: NavigationItem[]): NavigationItem[] => {
      const result: NavigationItem[] = []

      for (const item of items) {
        if (item.type === "file") {
          result.push(item)
        }

        if (item.children) {
          result.push(...flattenItems(item.children))
        }
      }

      return result
    }

    return flattenItems(this.config.navigation)
  }

  generateBreadcrumbs(slug: string): Array<{ title: string; href: string }> {
    const breadcrumbs: Array<{ title: string; href: string }> = []
    const parts = slug.split("/")

    // Add home
    breadcrumbs.push({ title: "Documentation", href: "/docs" })

    // Build breadcrumbs from slug parts
    let currentPath = ""
    for (const part of parts) {
      currentPath += (currentPath ? "/" : "") + part
      const item = this.findItemBySlug(currentPath)

      if (item) {
        breadcrumbs.push({
          title: item.title,
          href: item.href || `/docs/${currentPath}`,
        })
      } else {
        // Fallback: create breadcrumb from slug part
        const title = part.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        breadcrumbs.push({
          title,
          href: `/docs/${currentPath}`,
        })
      }
    }

    return breadcrumbs
  }

  searchDocuments(
    query: string,
    filters?: {
      tags?: string[]
      difficulty?: string
      category?: string
    },
  ) {
    const results: any[] = []

    for (const [relativePath, doc] of this.documentsCache.entries()) {
      let score = 0

      // Search in title
      if (doc.frontmatter.title?.toLowerCase().includes(query.toLowerCase())) {
        score += 10
      }

      // Search in content
      if (doc.content.toLowerCase().includes(query.toLowerCase())) {
        score += 5
      }

      // Search in tags
      if (doc.frontmatter.tags?.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))) {
        score += 3
      }

      // Apply filters
      if (filters?.tags && !filters.tags.some((tag) => doc.frontmatter.tags?.includes(tag))) {
        continue
      }

      if (filters?.difficulty && doc.frontmatter.difficulty !== filters.difficulty) {
        continue
      }

      if (score > 0) {
        results.push({
          ...doc,
          relativePath,
          score,
        })
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }

  getRelatedDocuments(documentPath: string, limit = 5) {
    const currentDoc = this.documentsCache.get(documentPath)
    if (!currentDoc) return []

    const related: any[] = []

    for (const [relativePath, doc] of this.documentsCache.entries()) {
      if (relativePath === documentPath) continue

      let similarity = 0

      // Check tag overlap
      const currentTags = currentDoc.frontmatter.tags || []
      const docTags = doc.frontmatter.tags || []
      const tagOverlap = currentTags.filter((tag: string) => docTags.includes(tag)).length
      similarity += tagOverlap * 2

      // Check category similarity
      if (currentDoc.frontmatter.category === doc.frontmatter.category) {
        similarity += 3
      }

      // Check difficulty similarity
      if (currentDoc.frontmatter.difficulty === doc.frontmatter.difficulty) {
        similarity += 1
      }

      if (similarity > 0) {
        related.push({
          ...doc,
          relativePath,
          similarity,
        })
      }
    }

    return related.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
  }

  getDocumentStats() {
    const stats = {
      totalDocuments: this.documentsCache.size,
      totalWords: 0,
      averageReadTime: 0,
      difficulties: { beginner: 0, intermediate: 0, advanced: 0 },
      tags: new Map<string, number>(),
    }

    for (const doc of this.documentsCache.values()) {
      stats.totalWords += doc.wordCount

      const difficulty = doc.frontmatter.difficulty || "beginner"
      if (difficulty in stats.difficulties) {
        stats.difficulties[difficulty as keyof typeof stats.difficulties]++
      }

      const tags = doc.frontmatter.tags || []
      for (const tag of tags) {
        stats.tags.set(tag, (stats.tags.get(tag) || 0) + 1)
      }
    }

    stats.averageReadTime = Math.ceil(stats.totalWords / 200 / stats.totalDocuments)

    return stats
  }
}
