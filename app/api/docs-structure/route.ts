import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

interface NavItem {
  title: string
  href?: string
  icon: string
  type: "file" | "folder"
  items?: NavItem[]
}

// Function to determine icon based on filename or folder name
function getIconForItem(name: string, isFolder: boolean): string {
  if (isFolder) return "Folder"

  const lowerName = name.toLowerCase()
  if (lowerName.includes("api") || lowerName.includes("reference")) return "Code"
  if (lowerName.includes("guide") || lowerName.includes("tutorial")) return "Users"
  if (lowerName.includes("introduction") || lowerName.includes("getting-started")) return "Home"
  if (lowerName.includes("architecture") || lowerName.includes("system")) return "Database"
  if (lowerName.includes("example") || lowerName.includes("demo")) return "Layers"
  if (lowerName.includes("install") || lowerName.includes("setup")) return "Wrench"

  return "FileText"
}

// Function to convert filename to title
function fileNameToTitle(fileName: string): string {
  return fileName
    .replace(/\.md$/, "")
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Function to extract title from markdown content
async function extractTitleFromMarkdown(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    const titleMatch = content.match(/^#\s+(.+)$/m)
    return titleMatch ? titleMatch[1].trim() : ""
  } catch {
    return ""
  }
}

// Recursive function to read directory structure
async function readDocsStructure(dirPath: string, basePath = "/docs"): Promise<NavItem[]> {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    const navItems: NavItem[] = []

    // Sort items: folders first, then files, both alphabetically
    const sortedItems = items.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })

    for (const item of sortedItems) {
      const itemPath = path.join(dirPath, item.name)
      const relativePath = path.relative(path.join(process.cwd(), "docs"), itemPath)

      if (item.isDirectory()) {
        // Handle folders
        const subItems = await readDocsStructure(itemPath, basePath)
        const folderTitle = fileNameToTitle(item.name)

        navItems.push({
          title: folderTitle,
          type: "folder",
          icon: getIconForItem(item.name, true),
          items: subItems,
        })
      } else if (item.name.endsWith(".md")) {
        // Handle markdown files
        const slug = relativePath.replace(/\.md$/, "").replace(/\\/g, "/")
        const href = `${basePath}/${slug}`

        // Try to extract title from markdown, fallback to filename
        const markdownTitle = await extractTitleFromMarkdown(itemPath)
        const title = markdownTitle || fileNameToTitle(item.name)

        navItems.push({
          title,
          href,
          type: "file",
          icon: getIconForItem(item.name, false),
        })
      }
    }

    return navItems
  } catch (error) {
    console.error("Error reading docs structure:", error)
    return []
  }
}

export async function GET() {
  try {
    const docsPath = path.join(process.cwd(), "docs")

    // Check if docs directory exists
    try {
      await fs.access(docsPath)
    } catch {
      // If docs directory doesn't exist, return empty structure
      return NextResponse.json([])
    }

    const structure = await readDocsStructure(docsPath)
    return NextResponse.json(structure)
  } catch (error) {
    console.error("Error generating docs structure:", error)
    return NextResponse.json({ error: "Failed to read docs structure" }, { status: 500 })
  }
}
