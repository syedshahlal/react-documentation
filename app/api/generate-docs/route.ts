import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, options = {} } = await request.json()

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    // Generate unique filename for this documentation
    const timestamp = Date.now()
    const outputFile = path.join(process.cwd(), "temp", `api_docs_${timestamp}.json`)

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(outputFile), { recursive: true })

    return new Promise((resolve) => {
      const pythonProcess = spawn("python3", [
        path.join(process.cwd(), "scripts", "api_doc_generator.py"),
        repoUrl,
        outputFile,
      ])

      let stdout = ""
      let stderr = ""

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString()
      })

      pythonProcess.on("close", async (code) => {
        if (code === 0) {
          try {
            // Read the generated documentation
            const docsContent = await fs.readFile(outputFile, "utf-8")
            const docs = JSON.parse(docsContent)

            // Clean up temp file
            await fs.unlink(outputFile).catch(() => {})

            resolve(
              NextResponse.json({
                success: true,
                documentation: docs,
                stdout,
              }),
            )
          } catch (error) {
            resolve(
              NextResponse.json({ error: "Failed to read generated documentation", details: error }, { status: 500 }),
            )
          }
        } else {
          resolve(NextResponse.json({ error: "Documentation generation failed", stderr, stdout }, { status: 500 }))
        }
      })
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request", details: error }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const repoUrl = searchParams.get("repo")

  if (!repoUrl) {
    return NextResponse.json({ error: "Repository URL parameter is required" }, { status: 400 })
  }

  // For GET requests, we'll return cached documentation if available
  // or trigger generation
  try {
    const cacheKey = Buffer.from(repoUrl).toString("base64")
    const cacheFile = path.join(process.cwd(), "cache", `${cacheKey}.json`)

    try {
      const cachedDocs = await fs.readFile(cacheFile, "utf-8")
      return NextResponse.json({
        success: true,
        documentation: JSON.parse(cachedDocs),
        cached: true,
      })
    } catch {
      // Cache miss, generate new documentation
      return NextResponse.json({
        message: "Documentation not cached. Use POST to generate.",
        repoUrl,
      })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request", details: error }, { status: 500 })
  }
}
