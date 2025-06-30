import path from "path"
import { notFound } from "next/navigation"
import matter from "gray-matter"
import fs from "fs/promises"

import { Sidebar } from "@/components/sidebar"
import { DocContent } from "@/components/doc-content"
import { Breadcrumb } from "@/components/breadcrumb"
import { PageNavigation } from "@/components/page-navigation"
import { TableOfContents } from "@/components/table-of-contents"
import { Header } from "@/components/header"
import { navigationService } from "@/lib/navigation-service"

type DocMeta = {
  title?: string
  description?: string
  author?: string
  tags?: string[]
  difficulty?: "beginner" | "intermediate" | "advanced"
  estimatedReadTime?: number
  lastUpdated?: string
}

interface DocData {
  title: string
  content: string
  metadata: DocMeta
}

/**
 * Try to locate a markdown file for the provided slug array.
 *
 * 1. Direct match in /docs/…
 * 2. If slug **doesn't** start with gcp-5.7 ➜ also look in /docs/gcp-5.7/…
 * 3. If slug **does** start with gcp-5.7 ➜ also look **without** that prefix
 * 4. Finally, consult navigation.config.json (via NavigationService)
 */
async function findMarkdownFile(slugParts: string[]): Promise<string | null> {
  const base = path.join(process.cwd(), "docs")
  const slugPath = path.join(...slugParts)

  const variants = new Set<string>()

  /* ─── (1) direct path variants ─────────────────────────────── */
  variants.add(path.join(base, `${slugPath}.md`))
  variants.add(path.join(base, `${slugPath}.mdx`))
  variants.add(path.join(base, slugPath, "index.md"))
  variants.add(path.join(base, slugPath, "index.mdx"))

  /* ─── (2) add prefixed variants if needed ──────────────────── */
  if (!slugParts[0]?.startsWith("gcp-5.7")) {
    const prefixed = path.join(base, "gcp-5.7", slugPath)
    variants.add(`${prefixed}.md`)
    variants.add(`${prefixed}.mdx`)
    variants.add(path.join(prefixed, "index.md"))
    variants.add(path.join(prefixed, "index.mdx"))
  }

  /* ─── (3) add un-prefixed variants if slug starts with gcp-5.7 */
  if (slugParts[0] === "gcp-5.7") {
    const withoutPrefix = path.join(...slugParts.slice(1))
    variants.add(path.join(base, `${withoutPrefix}.md`))
    variants.add(path.join(base, `${withoutPrefix}.mdx`))
    variants.add(path.join(base, withoutPrefix, "index.md"))
    variants.add(path.join(base, withoutPrefix, "index.mdx"))
  }

  /* ─── (4) navigation-config hint ───────────────────────────── */
  const navHint = navigationService.findItemBySlug(slugPath)
  if (navHint?.filePath) {
    variants.add(path.join(process.cwd(), navHint.filePath))
  }

  /* ─── probe each candidate ─────────────────────────────────── */
  for (const filePath of variants) {
    try {
      await fs.access(filePath)
      return filePath
    } catch {
      /* continue */
    }
  }
  return null
}

async function loadDoc(slugParts: string[]): Promise<DocData | null> {
  const filePath = await findMarkdownFile(slugParts)
  if (!filePath) return null

  const raw = await fs.readFile(filePath, "utf8")
  const { data: fm, content } = matter(raw)
  const stats = await fs.stat(filePath)

  const wordCount = content.split(/\s+/).length
  const defaultTitle = slugParts[slugParts.length - 1].replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const metadata: DocMeta = {
    title: fm.title ?? defaultTitle,
    description: fm.description,
    author: fm.author,
    tags: fm.tags ?? [],
    difficulty: fm.difficulty ?? "beginner",
    estimatedReadTime: fm.estimatedReadTime ?? Math.ceil(wordCount / 200),
    lastUpdated: fm.lastUpdated ?? stats.mtime.toISOString().split("T")[0],
  }

  return {
    title: metadata.title ?? defaultTitle,
    content,
    metadata,
  }
}

/* ──────────────────────────────────────────────────────────── */

export default async function DocPage({
  params,
}: {
  params: { slug: string[] }
}) {
  await navigationService.init() // make sure nav is ready

  const { slug } = params
  const doc = await loadDoc(slug)
  if (!doc) notFound()

  const { previousPage, nextPage } = navigationService.getPrevNext(slug.join("/"))

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />

      <div className="flex">
        {/* left sidebar */}
        <aside className="fixed inset-y-0 left-0 w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pt-16 overflow-y-auto">
          <Sidebar />
        </aside>

        {/* main */}
        <main className="flex-1 ml-80 mr-80 px-8 py-6">
          <Breadcrumb slug={slug} />
          <div className="mt-6">
            <DocContent
              title={doc.title}
              content={doc.content}
              lastUpdated={doc.metadata.lastUpdated ?? ""}
              metadata={doc.metadata}
            />
            <PageNavigation previousPage={previousPage} nextPage={nextPage} />
          </div>
        </main>

        {/* right sidebar */}
        <aside className="fixed inset-y-0 right-0 w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pt-16 overflow-y-auto">
          <div className="p-6">
            <TableOfContents content={doc.content} />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* --- static generation -------------------------------------------------- */
export async function generateStaticParams() {
  await navigationService.init()
  return navigationService
    .getFlatItems()
    .filter((i) => i.type === "file" && i.href?.startsWith("/docs/"))
    .map((i) => ({
      slug: i.href!.replace(/^\/docs\//, "").split("/"),
    }))
}
