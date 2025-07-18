import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs/promises"

export async function POST(request: NextRequest) {
  try {
    const { repoPath, format = "mdx", options = {} } = await request.json()

    if (!repoPath) {
      return NextResponse.json({ error: "Repository path is required" }, { status: 400 })
    }

    // Validate format
    if (!["json", "mdx"].includes(format)) {
      return NextResponse.json({ error: "Format must be 'json' or 'mdx'" }, { status: 400 })
    }

    // Validate that the path exists and is accessible
    try {
      await fs.access(repoPath)
    } catch {
      return NextResponse.json({ error: "Repository path does not exist or is not accessible" }, { status: 400 })
    }

    // Generate unique filename for this analysis
    const timestamp = Date.now()
    const fileExtension = format === "mdx" ? "mdx" : "json"
    const outputFile = path.join(process.cwd(), "temp", `python_docs_${timestamp}.${fileExtension}`)

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(outputFile), { recursive: true })

    return new Promise((resolve) => {
      const pythonProcess = spawn("python3", [
        path.join(process.cwd(), "scripts", "python_api_docs.py"),
        repoPath,
        "--output",
        outputFile,
        "--format",
        format,
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

            const responseData: any = {
              success: true,
              stdout,
              format,
              output_file: path.basename(outputFile),
            }

            if (format === "json") {
              responseData.documentation = JSON.parse(docsContent)
            } else {
              responseData.mdx_content = docsContent
            }

            // Clean up temp file
            await fs.unlink(outputFile).catch(() => {})

            resolve(NextResponse.json(responseData))
          } catch (error) {
            resolve(
              NextResponse.json(
                {
                  error: "Failed to read generated documentation",
                  details: error,
                  format,
                },
                { status: 500 },
              ),
            )
          }
        } else {
          resolve(
            NextResponse.json(
              {
                error: "Documentation analysis failed",
                stderr,
                stdout,
                format,
              },
              { status: 500 },
            ),
          )
        }
      })

      // Set a timeout to prevent hanging
      setTimeout(() => {
        pythonProcess.kill()
        resolve(
          NextResponse.json(
            {
              error: "Analysis timeout - process took too long",
              format,
            },
            { status: 408 },
          ),
        )
      }, 300000) // 5 minute timeout
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request", details: error }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "🐍 Python API Documentation Generator",
    description: "Analyze Python repositories and generate beautiful MDX documentation",
    usage: "POST with { repoPath: '/path/to/repo', format: 'json|mdx' }",
    formats: {
      json: "Returns structured JSON data for programmatic use",
      mdx: "Returns ready-to-use MDX content with interactive components",
    },
    features: [
      "📦 Analyzes Python packages, modules, classes, and functions",
      "📝 Extracts docstrings in Google, NumPy, and Sphinx formats",
      "🎨 Generates interactive MDX components",
      "🔍 Supports inheritance analysis and method categorization",
      "⚡ Extracts type hints and function signatures",
      "📱 Creates responsive documentation for modern sites",
    ],
    examples: {
      json_request: {
        repoPath: "/path/to/python/repo",
        format: "json",
      },
      mdx_request: {
        repoPath: "/path/to/python/repo",
        format: "mdx",
      },
    },
    command_line_usage: [
      "python scripts/python_api_docs.py /path/to/repo",
      "python scripts/python_api_docs.py ./my_package --output my_docs.mdx",
      "python scripts/python_api_docs.py ~/projects/flask --format json --verbose",
    ],
  })
}
