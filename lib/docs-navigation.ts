import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface DocItem {
  title: string
  href: string
  filePath: string
  order: number
  section: string
}

export function getFlatDocList(): DocItem[] {
  const docsDir = path.join(process.cwd(), "docs")
  const items: DocItem[] = []

  function processDirectory(dir: string, basePath = "") {
    if (!fs.existsSync(dir)) return

    const entries = fs.readdirSync(dir, { withFileTypes: true })

    // Sort entries by name (handles numbered prefixes)
    entries.sort((a, b) => a.name.localeCompare(b.name))

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.join(basePath, entry.name)

      if (entry.isDirectory()) {
        processDirectory(fullPath, relativePath)
      } else if (entry.name.endsWith(".md")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8")
          const { data: frontmatter } = matter(content)

          // Extract order from folder/file name (e.g., "01_Introduction" -> 1)
          const orderMatch = entry.name.match(/^(\d+)_/)
          const folderOrderMatch = basePath.match(/(\d+)_/)
          const order = orderMatch
            ? Number.parseInt(orderMatch[1])
            : folderOrderMatch
              ? Number.parseInt(folderOrderMatch[1]) * 100
              : 999

          // Create clean href
          const cleanPath = relativePath
            .replace(/\.md$/, "")
            .replace(/^\d+_/, "")
            .replace(/\/\d+_/g, "/")

          const title = frontmatter.title || entry.name.replace(/\.md$/, "").replace(/^\d+_/, "").replace(/-/g, " ")

          const section = basePath.replace(/^\d+_/, "").replace(/-/g, " ") || "General"

          items.push({
            title,
            href: `/docs/${cleanPath}`,
            filePath: relativePath,
            order,
            section,
          })
        } catch (error) {
          console.warn(`Error processing ${fullPath}:`, error)
        }
      }
    }
  }

  processDirectory(docsDir)
  return items.sort((a, b) => a.order - b.order)
}

export function getPageNavigation(currentHref: string) {
  const allDocs = getFlatDocList()
  const currentIndex = allDocs.findIndex((doc) => doc.href === currentHref)

  return {
    previous: currentIndex > 0 ? allDocs[currentIndex - 1] : null,
    next: currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null,
  }
}
