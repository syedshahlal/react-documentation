import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const difficulty = searchParams.get("difficulty") || ""
  const tags = searchParams.get("tags") || ""
  const author = searchParams.get("author") || ""
  const limit = Number.parseInt(searchParams.get("limit") || "20")

  try {
    // Prepare search request
    const searchRequest = {
      query,
      filters: {
        ...(category && { category }),
        ...(difficulty && { difficulty }),
        ...(tags && { tags }),
        ...(author && { author }),
      },
      limit,
    }

    // Execute Python search script
    const scriptPath = path.join(process.cwd(), "scripts", "search_backend.py")
    const pythonProcess = spawn("python3", [scriptPath, "search", JSON.stringify(searchRequest)])

    let output = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    return new Promise((resolve) => {
      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error("Python script error:", errorOutput)
          resolve(NextResponse.json({ error: "Search failed", details: errorOutput }, { status: 500 }))
        } else {
          try {
            const result = JSON.parse(output)
            resolve(NextResponse.json(result))
          } catch (parseError) {
            console.error("JSON parse error:", parseError)
            resolve(NextResponse.json({ error: "Invalid response format", details: output }, { status: 500 }))
          }
        }
      })
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "index") {
      // Execute Python indexing script
      const scriptPath = path.join(process.cwd(), "scripts", "search_backend.py")
      const pythonProcess = spawn("python3", [scriptPath, "index"])

      let output = ""
      let errorOutput = ""

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      return new Promise((resolve) => {
        pythonProcess.on("close", (code) => {
          if (code !== 0) {
            console.error("Python indexing error:", errorOutput)
            resolve(NextResponse.json({ error: "Indexing failed", details: errorOutput }, { status: 500 }))
          } else {
            try {
              const result = JSON.parse(output)
              resolve(NextResponse.json(result))
            } catch (parseError) {
              console.error("JSON parse error:", parseError)
              resolve(NextResponse.json({ error: "Invalid response format", details: output }, { status: 500 }))
            }
          }
        })
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Search API POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
