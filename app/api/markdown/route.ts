import { type NextRequest, NextResponse } from "next/server"
import { MarkdownManager } from "@/lib/markdown-manager"

const markdownManager = new MarkdownManager("./docs")

export async function GET() {
  try {
    const files = await markdownManager.getAllFiles()
    const tree = markdownManager.buildTree(files)

    return NextResponse.json({
      files,
      tree,
    })
  } catch (error) {
    console.error("Error fetching markdown files:", error)
    return NextResponse.json({ error: "Failed to fetch markdown files" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { path, title, content, tags } = await request.json()

    if (!path || !title || !content) {
      return NextResponse.json({ error: "Path, title, and content are required" }, { status: 400 })
    }

    const file = await markdownManager.createFile(path, title, content, tags)

    return NextResponse.json(file, { status: 201 })
  } catch (error) {
    console.error("Error creating markdown file:", error)
    return NextResponse.json({ error: "Failed to create markdown file" }, { status: 500 })
  }
}
