import fs from "fs/promises"
import path from "path"
import { type NavigationItem, defaultNavigationConfig } from "./navigation-config"

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
  private config = defaultNavigationConfig
  private flatItems: NavigationItem[] = []
  private ready = false

  async init() {
    if (this.ready) return
    await this.loadConfig()
    this.flatten()
    this.ready = true
  }

  getNavigation() {
    return this.config.navigation
  }

  getFlatItems() {
    return this.flatItems
  }

  findItemBySlug(slug: string) {
    return this.flatItems.find((i) => i.href === `/docs/${slug}`) ?? null
  }

  getPrevNext(slug: string) {
    const idx = this.flatItems.findIndex((i) => i.href === `/docs/${slug}`)
    if (idx === -1) return { previousPage: null, nextPage: null }

    const prev = this.flatItems[idx - 1]
    const next = this.flatItems[idx + 1]
    const make = (item?: NavigationItem) =>
      item
        ? {
            title: item.title,
            href: item.href!,
          }
        : null

    return { previousPage: make(prev), nextPage: make(next) }
  }

  generateBreadcrumbs(slug: string) {
    const crumbs: { title: string; href: string }[] = [{ title: "Documentation", href: "/docs" }]

    const parts: string[] = []
    slug.split("/").forEach((p) => {
      parts.push(p)
      const item = this.findItemBySlug(parts.join("/"))
      crumbs.push({
        title: item?.title ?? p,
        href: `/docs/${parts.join("/")}`,
      })
    })
    return crumbs
  }

  private async loadConfig() {
    const cfgFile = path.join(process.cwd(), "navigation.config.json")
    try {
      const raw = await fs.readFile(cfgFile, "utf8")
      this.config = { ...defaultNavigationConfig, ...JSON.parse(raw) }
    } catch {
      /* fallback to default if file missing */
    }
  }

  private flatten() {
    const walk = (items: NavigationItem[]) => {
      for (const it of items) {
        if (it.type === "file") this.flatItems.push(it)
        if (it.children?.length) walk(it.children)
      }
    }
    this.flatItems = []
    walk(this.config.navigation)
  }
}

export const navigationService = new NavigationService()
