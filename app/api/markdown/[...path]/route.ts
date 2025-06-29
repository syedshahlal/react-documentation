import { type NextRequest, NextResponse } from "next/server"
import { MarkdownManager } from "@/lib/markdown-manager"

const markdownManager = new MarkdownManager("./docs")

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params
    const filePath = path.join("/") + ".md"

    const file = await markdownManager.readFile(`./docs/${filePath}`)

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error("Error fetching markdown file:", error)
    return NextResponse.json({ error: "Failed to fetch markdown file" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params
    const filePath = path.join("/") + ".md"
    const { title, content, tags } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const file = await markdownManager.updateFile(filePath, title, content, tags)

    return NextResponse.json(file)
  } catch (error) {
    console.error("Error updating markdown file:", error)
    return NextResponse.json({ error: "Failed to update markdown file" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params
    const filePath = path.join("/") + ".md"

    await markdownManager.deleteFile(filePath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting markdown file:", error)
    return NextResponse.json({ error: "Failed to delete markdown file" }, { status: 500 })
  }
}
