import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    const { repoPath, options = {} } = await request.json()

    if (!repoPath) {
      return NextResponse.json({ error: "Repository path is required" }, { status: 400 })
    }

    // Validate that the path exists and is accessible
    try {
      await fs.access(repoPath)
    } catch {
      return NextResponse.json({ error: "Repository path does not exist or is not accessible" }, { status: 400 })
    }

    // Generate unique filename for this analysis
    const timestamp = Date.now()
    const outputFile = path.join(process.cwd(), "temp", `python_docs_${timestamp}.json`)

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(outputFile), { recursive: true })

    return new Promise((resolve) => {
      const pythonProcess = spawn("python3", [
        path.join(process.cwd(), "scripts", "python_doc_analyzer.py"),
        repoPath,
        "-o",
        outputFile,
        "--verbose",
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
          resolve(NextResponse.json({ error: "Documentation analysis failed", stderr, stdout }, { status: 500 }))
        }
      })

      // Set a timeout to prevent hanging
      setTimeout(() => {
        pythonProcess.kill()
        resolve(NextResponse.json({ error: "Analysis timeout - process took too long" }, { status: 408 }))
      }, 300000) // 5 minute timeout
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request", details: error }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Python Repository Analyzer API",
    usage: "POST with { repoPath: '/path/to/repo' }",
    features: [
      "Analyzes Python packages, modules, classes, and functions",
      "Extracts docstrings in Google, NumPy, and Sphinx formats",
      "Generates comprehensive API documentation",
      "Supports inheritance analysis and method categorization",
      "Extracts type hints and function signatures",
    ],
  })
}
