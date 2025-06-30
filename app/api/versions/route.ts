import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const docsPath = path.join(process.cwd(), "docs")

    // Check if docs directory exists
    try {
      await fs.access(docsPath)
    } catch {
      return NextResponse.json([])
    }

    const items = await fs.readdir(docsPath, { withFileTypes: true })

    // Filter for directories only and extract version info
    const versions = items
      .filter((item) => item.isDirectory())
      .map((item) => ({
        id: item.name,
        label: item.name,
        value: item.name,
      }))
      .sort((a, b) => {
        // Sort versions in descending order (newest first)
        // Extract version numbers for proper sorting
        const aVersion = a.id.match(/(\d+\.?\d*)/)?.[1] || "0"
        const bVersion = b.id.match(/(\d+\.?\d*)/)?.[1] || "0"
        return Number.parseFloat(bVersion) - Number.parseFloat(aVersion)
      })

    return NextResponse.json(versions)
  } catch (error) {
    console.error("Error getting versions:", error)
    return NextResponse.json({ error: "Failed to get versions" }, { status: 500 })
  }
}
