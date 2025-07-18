import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { unlink } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { repoPath, format = "mdx" } = await request.json()

    if (!repoPath) {
      return NextResponse.json({ error: "Repository path is required" }, { status: 400 })
    }

    // Create a unique temporary file name
    const timestamp = Date.now()
    const outputFile = path.join(process.cwd(), "temp", `analysis_${timestamp}.${format}`)

    // Ensure temp directory exists
    const fs = require("fs")
    const tempDir = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Run the Python analysis script
    const pythonProcess = spawn("python3", [
      path.join(process.cwd(), "scripts", "python_api_docs.py"),
      repoPath,
      "--format",
      format,
      "--output",
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

    // Wait for the process to complete
    const exitCode = await new Promise((resolve) => {
      pythonProcess.on("close", resolve)
    })

    if (exitCode !== 0) {
      console.error("Python script error:", stderr)
      return NextResponse.json(
        {
          error: "Failed to analyze repository",
          details: stderr,
          stdout,
        },
        { status: 500 },
      )
    }

    // Read the generated file
    const fs2 = require("fs").promises
    let content

    try {
      content = await fs2.readFile(outputFile, "utf-8")
    } catch (readError) {
      console.error("Error reading output file:", readError)
      return NextResponse.json({ error: "Failed to read generated documentation" }, { status: 500 })
    }

    // Clean up the temporary file
    try {
      await unlink(outputFile)
    } catch (unlinkError) {
      console.warn("Warning: Could not delete temporary file:", unlinkError)
    }

    // Parse JSON content if format is json
    let responseData
    if (format === "json") {
      try {
        responseData = JSON.parse(content)
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError)
        return NextResponse.json({ error: "Failed to parse generated JSON" }, { status: 500 })
      }
    } else {
      responseData = { content, format: "mdx" }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      logs: stdout,
      message: "Repository analyzed successfully with imported API documentation",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Python Repository Analyzer API",
    description:
      "POST to this endpoint with repoPath to analyze Python repositories and extract API documentation including imported modules",
    usage: {
      method: "POST",
      body: {
        repoPath: "string (required) - Path to Python repository",
        format: 'string (optional) - "json" or "mdx", defaults to "mdx"',
      },
    },
    features: [
      "Analyzes Python packages, modules, classes, and functions",
      "Follows import statements to extract imported API documentation",
      "Generates interactive MDX documentation",
      "Supports multiple docstring formats (Google, NumPy, Sphinx)",
      "Extracts signatures, parameters, return types, and examples",
      "Provides JSON data for programmatic use",
    ],
  })
}
