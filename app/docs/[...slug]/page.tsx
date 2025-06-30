import { notFound } from "next/navigation"
import { promises as fs } from "fs"
import path from "path"
import matter from "gray-matter"
import { Sidebar } from "@/components/sidebar"
import { DocContent } from "@/components/doc-content"
import { Breadcrumb } from "@/components/breadcrumb"
import { PageNavigation } from "@/components/page-navigation"
import { TableOfContents } from "@/components/table-of-contents"
import { Header } from "@/components/header"
import { NavigationService } from "@/lib/navigation-service"

interface DocMetadata {
  title: string
  description?: string
  author?: string
  lastUpdated?: string
  tags?: string[]
  difficulty?: "beginner" | "intermediate" | "advanced"
  estimatedReadTime?: number
  [key: string]: any
}

interface DocData {
  title: string
  content: string
  lastUpdated: string
  metadata: DocMetadata
}

// Navigation structure for determining next/previous pages
const navigationOrder = [
  { slug: "introduction", title: "Introduction to GRA Core Platform" },
  { slug: "user-guide", title: "User Guide" },
  { slug: "api-reference", title: "API Reference" },
  { slug: "examples", title: "Examples & Tutorials" },
  { slug: "development", title: "Development Guide" },
  { slug: "architecture", title: "Platform Architecture" },
]

// Initialize navigation service
const navigationService = new NavigationService()

const getDocContent = async (slug: string[]): Promise<DocData | null> => {
  try {
    await navigationService.initialize()

    const slugPath = path.join(...slug)
    const baseDocs = path.join(process.cwd(), "docs")
    const variants: string[] = []

    // ─── ❶  Try the exact slug path first ──────────────────────────────────────────
    variants.push(
      path.join(baseDocs, `${slugPath}.md`),
      path.join(baseDocs, `${slugPath}.mdx`),
      path.join(baseDocs, slugPath, "index.md"),
      path.join(baseDocs, slugPath, "index.mdx"),
    )

    // ─── ❷  If slug *doesn’t* start with "gcp-5.7", also try prefixed versions ────
    if (!slug[0]?.startsWith("gcp-5.7")) {
      const prefixed = path.join(baseDocs, "gcp-5.7", slugPath)
      variants.push(
        `${prefixed}.md`,
        `${prefixed}.mdx`,
        path.join(prefixed, "index.md"),
        path.join(prefixed, "index.mdx"),
      )
    }

    // ─── ❸  If slug *does* start with "gcp-5.7", also try WITHOUT that prefix ─────
    if (slug[0] === "gcp-5.7") {
      const withoutPrefixPath = path.join(...slug.slice(1))
      variants.push(
        path.join(baseDocs, `${withoutPrefixPath}.md`),
        path.join(baseDocs, `${withoutPrefixPath}.mdx`),
        path.join(baseDocs, withoutPrefixPath, "index.md"),
        path.join(baseDocs, withoutPrefixPath, "index.mdx"),
      )
    }

    // ─── ❹  Variant from navigation-config (highest priority) ──────────────────────
    const navItem = navigationService.findItemBySlug(slugPath)
    if (navItem?.filePath) {
      variants.unshift(path.join(process.cwd(), navItem.filePath))
    }

    // Find the first readable file
    let filePath: string | null = null
    for (const p of variants) {
      try {
        await fs.access(p)
        filePath = p
        break
      } catch {
        /* skip */
      }
    }

    if (!filePath) {
      console.warn("Document not found. Tried:", variants)
      return null
    }

    const raw = await fs.readFile(filePath, "utf8")
    const { data: frontmatter, content } = matter(raw)
    const stats = await fs.stat(filePath)

    const wordCount = content.split(/\s+/).length
    const estimatedReadTime = frontmatter.estimatedReadTime || Math.ceil(wordCount / 200)
    const lastUpdated = frontmatter.lastUpdated || stats.mtime.toISOString().split("T")[0]

    return {
      title: frontmatter.title ?? slug[slug.length - 1].replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      content,
      lastUpdated,
      metadata: {
        ...frontmatter,
        estimatedReadTime,
        lastUpdated,
      },
    }
  } catch (err) {
    console.error("getDocContent error:", err)
    return null
  }
}

const getPageNavigation = async (currentSlug: string[]) => {
  try {
    await navigationService.initialize()
    const navigation = navigationService.getNavigation()

    // Find current item and get navigation
    const currentPath = currentSlug.join("/")
    const currentItem = navigationService.findItemBySlug(currentPath)

    if (!currentItem) {
      return { previousPage: null, nextPage: null }
    }

    // Get flat list of all navigable items
    const flatItems = navigationService.getFlatNavigationItems()
    const currentIndex = flatItems.findIndex((item) => item.id === currentItem.id)

    if (currentIndex === -1) {
      return { previousPage: null, nextPage: null }
    }

    const previousItem = currentIndex > 0 ? flatItems[currentIndex - 1] : null
    const nextItem = currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null

    return {
      previousPage: previousItem
        ? {
            title: previousItem.title,
            href: previousItem.href || `/docs/${previousItem.id}`,
          }
        : null,
      nextPage: nextItem
        ? {
            title: nextItem.title,
            href: nextItem.href || `/docs/${nextItem.id}`,
          }
        : null,
    }
  } catch (error) {
    console.error("Error getting page navigation:", error)
    return { previousPage: null, nextPage: null }
  }
}

const generateBreadcrumbs = async (slug: string[]) => {
  try {
    await navigationService.initialize()
    return navigationService.generateBreadcrumbs(slug.join("/"))
  } catch (error) {
    console.error("Error generating breadcrumbs:", error)
    return []
  }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params

  // Get document content
  const doc = await getDocContent(slug)

  if (!doc) {
    console.log(`Document not found for slug: ${slug.join("/")}`)
    notFound()
  }

  // Get navigation for previous/next pages
  const { previousPage, nextPage } = await getPageNavigation(slug)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />

      <div className="flex">
        {/* Fixed Left Sidebar */}
        <div className="fixed left-0 top-0 bottom-0 w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto pt-20">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 ml-80 mr-80">
          <div className="max-w-none px-8 py-6">
            <Breadcrumb slug={slug} />

            <div className="mt-6">
              <DocContent
                title={doc.title}
                content={doc.content}
                lastUpdated={doc.lastUpdated}
                metadata={doc.metadata}
              />

              <PageNavigation previousPage={previousPage} nextPage={nextPage} />
            </div>
          </div>
        </main>

        {/* Fixed Right Sidebar - Table of Contents */}
        <div className="fixed right-0 top-0 bottom-0 w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto pt-20">
          <div className="p-6">
            <TableOfContents content={doc.content} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate static params for known routes
export async function generateStaticParams() {
  try {
    const navigationService = new NavigationService()
    await navigationService.initialize()

    // Get all navigable items and generate params
    const flatItems = navigationService.getFlatNavigationItems()
    const params = flatItems
      .filter((item) => item.type === "file" && item.href)
      .map((item) => {
        // Extract slug from href
        const href = item.href!
        const slug = href.replace("/docs/", "").split("/")
        return { slug }
      })

    // Add some common fallback routes
    const fallbackRoutes = [
      { slug: ["gcp-5.7", "introduction"] },
      { slug: ["gcp-5.7", "user-guide"] },
      { slug: ["gcp-5.7", "api-reference"] },
      { slug: ["gcp-5.7", "examples"] },
      { slug: ["gcp-5.7", "development"] },
      { slug: ["gcp-5.7", "architecture"] },
    ]

    return [...params, ...fallbackRoutes]
  } catch (error) {
    console.error("Error generating static params:", error)
    // Return fallback routes if navigation service fails
    return [
      { slug: ["gcp-5.7", "introduction"] },
      { slug: ["gcp-5.7", "user-guide"] },
      { slug: ["gcp-5.7", "api-reference"] },
      { slug: ["gcp-5.7", "examples"] },
      { slug: ["gcp-5.7", "development"] },
      { slug: ["gcp-5.7", "architecture"] },
    ]
  }
}
