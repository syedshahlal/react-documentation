import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"

export interface MarkdownFile {
  id: string
  title: string
  content: string
  path: string
  links: string[]
  backlinks: string[]
  metadata: {
    created: string
    modified: string
    tags?: string[]
  }
}

export interface TreeNode {
  id: string
  title: string
  path: string
  children: TreeNode[]
  links: string[]
  backlinks: string[]
}

export class MarkdownManager {
  private docsPath: string

  constructor(docsPath = "./docs") {
    this.docsPath = docsPath
  }

  async ensureDocsDirectory() {
    try {
      await fs.access(this.docsPath)
    } catch {
      await fs.mkdir(this.docsPath, { recursive: true })
    }
  }

  async getAllFiles(): Promise<MarkdownFile[]> {
    await this.ensureDocsDirectory()
    const files = await this.scanDirectory(this.docsPath)
    const markdownFiles: MarkdownFile[] = []

    for (const filePath of files) {
      if (filePath.endsWith(".md")) {
        const file = await this.readFile(filePath)
        if (file) {
          markdownFiles.push(file)
        }
      }
    }

    // Calculate backlinks
    this.calculateBacklinks(markdownFiles)
    return markdownFiles
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = []
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const subFiles = await this.scanDirectory(fullPath)
        files.push(...subFiles)
      } else {
        files.push(fullPath)
      }
    }

    return files
  }

  async readFile(filePath: string): Promise<MarkdownFile | null> {
    try {
      const content = await fs.readFile(filePath, "utf-8")
      const { data, content: markdownContent } = matter(content)
      const stats = await fs.stat(filePath)

      const relativePath = path.relative(this.docsPath, filePath)
      const id = this.pathToId(relativePath)
      const links = this.extractLinks(markdownContent)

      return {
        id,
        title: data.title || this.pathToTitle(relativePath),
        content: markdownContent,
        path: relativePath,
        links,
        backlinks: [],
        metadata: {
          created: data.created || stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          tags: data.tags || [],
        },
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      return null
    }
  }

  async createFile(filePath: string, title: string, content: string, tags?: string[]): Promise<MarkdownFile> {
    await this.ensureDocsDirectory()

    const fullPath = path.join(this.docsPath, filePath)
    const dir = path.dirname(fullPath)

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true })

    const frontMatter = {
      title,
      created: new Date().toISOString(),
      ...(tags && tags.length > 0 && { tags }),
    }

    const fileContent = matter.stringify(content, frontMatter)
    await fs.writeFile(fullPath, fileContent, "utf-8")

    return this.readFile(fullPath) as Promise<MarkdownFile>
  }

  async updateFile(filePath: string, title: string, content: string, tags?: string[]): Promise<MarkdownFile> {
    const fullPath = path.join(this.docsPath, filePath)
    const existingContent = await fs.readFile(fullPath, "utf-8")
    const { data } = matter(existingContent)

    const frontMatter = {
      ...data,
      title,
      modified: new Date().toISOString(),
      ...(tags !== undefined && { tags }),
    }

    const fileContent = matter.stringify(content, frontMatter)
    await fs.writeFile(fullPath, fileContent, "utf-8")

    return this.readFile(fullPath) as Promise<MarkdownFile>
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.docsPath, filePath)
    await fs.unlink(fullPath)
  }

  private extractLinks(content: string): string[] {
    const linkRegex = /\[\[([^\]]+)\]\]/g
    const links: string[] = []
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[1])
    }

    return [...new Set(links)] // Remove duplicates
  }

  private calculateBacklinks(files: MarkdownFile[]): void {
    const fileMap = new Map(files.map((f) => [f.id, f]))

    files.forEach((file) => {
      file.backlinks = []
    })

    files.forEach((file) => {
      file.links.forEach((linkId) => {
        const linkedFile = fileMap.get(linkId)
        if (linkedFile) {
          linkedFile.backlinks.push(file.id)
        }
      })
    })
  }

  buildTree(files: MarkdownFile[]): TreeNode[] {
    const tree: TreeNode[] = []
    const pathMap = new Map<string, TreeNode>()

    // Sort files by path depth
    const sortedFiles = files.sort((a, b) => a.path.split("/").length - b.path.split("/").length)

    sortedFiles.forEach((file) => {
      const pathParts = file.path.split("/")
      const node: TreeNode = {
        id: file.id,
        title: file.title,
        path: file.path,
        children: [],
        links: file.links,
        backlinks: file.backlinks,
      }

      pathMap.set(file.path, node)

      if (pathParts.length === 1) {
        // Root level file
        tree.push(node)
      } else {
        // Find parent directory
        const parentPath = pathParts.slice(0, -1).join("/")
        const parentNode = this.findOrCreateParentNode(parentPath, pathMap, tree)
        parentNode.children.push(node)
      }
    })

    return tree
  }

  private findOrCreateParentNode(parentPath: string, pathMap: Map<string, TreeNode>, tree: TreeNode[]): TreeNode {
    let parentNode = pathMap.get(parentPath)

    if (!parentNode) {
      const pathParts = parentPath.split("/")
      parentNode = {
        id: this.pathToId(parentPath),
        title: pathParts[pathParts.length - 1],
        path: parentPath,
        children: [],
        links: [],
        backlinks: [],
      }

      pathMap.set(parentPath, parentNode)

      if (pathParts.length === 1) {
        tree.push(parentNode)
      } else {
        const grandParentPath = pathParts.slice(0, -1).join("/")
        const grandParentNode = this.findOrCreateParentNode(grandParentPath, pathMap, tree)
        grandParentNode.children.push(parentNode)
      }
    }

    return parentNode
  }

  private pathToId(filePath: string): string {
    return filePath.replace(/\.md$/, "").replace(/\//g, "-")
  }

  private pathToTitle(filePath: string): string {
    const name = path.basename(filePath, ".md")
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }
}
