import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

interface SearchResult {
  id: number
  file_path: string
  title: string
  content: string
  excerpt: string
  snippet: string
  tags: string[]
  category: string
  difficulty: string
  author: string
  last_modified: string
  word_count: number
  read_time: number
  url: string
  rank: number
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  filters: Record<string, any>
  suggestions: string[]
  stats: {
    total_documents: number
    total_words: number
    average_read_time: number
    categories: string[]
    difficulties: string[]
  }
}

function runPythonScript(scriptPath: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [scriptPath, ...args], {
      cwd: process.cwd(),
    })

    let stdout = ""
    let stderr = ""

    python.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    python.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    python.on("close", (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`Python script failed: ${stderr}`))
      }
    })
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category") || ""
    const difficulty = searchParams.get("difficulty") || ""
    const tags = searchParams.get("tags") || ""
    const author = searchParams.get("author") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Build filters
    const filters: Record<string, string> = {}
    if (category) filters.category = category
    if (difficulty) filters.difficulty = difficulty
    if (tags) filters.tags = tags
    if (author) filters.author = author

    const scriptPath = path.join(process.cwd(), "scripts", "search_backend.py")

    // Create the search request
    const searchRequest = {
      query,
      filters,
      limit,
    }

    const result = await runPythonScript(scriptPath, ["search", JSON.stringify(searchRequest)])
    const searchResponse: SearchResponse = JSON.parse(result)

    return NextResponse.json(searchResponse)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: "Search failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    const scriptPath = path.join(process.cwd(), "scripts", "search_backend.py")

    if (action === "index") {
      // Reindex all documents
      await runPythonScript(scriptPath, ["index"])
      return NextResponse.json({ success: true, message: "Documents reindexed successfully" })
    } else if (action === "stats") {
      // Get search statistics
      const result = await runPythonScript(scriptPath, ["stats"])
      const stats = JSON.parse(result)
      return NextResponse.json(stats)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: "Operation failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
