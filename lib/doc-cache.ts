import fs from "fs/promises"
import path from "path"

export class DocCache {
  private cacheDir: string

  constructor() {
    this.cacheDir = path.join(process.cwd(), "cache")
  }

  private async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  private getCacheKey(repoUrl: string): string {
    return Buffer.from(repoUrl).toString("base64").replace(/[/+=]/g, "_")
  }

  async get(repoUrl: string): Promise<any | null> {
    try {
      await this.ensureCacheDir()
      const cacheKey = this.getCacheKey(repoUrl)
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`)

      const content = await fs.readFile(cacheFile, "utf-8")
      const cached = JSON.parse(content)

      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - cached.timestamp
      if (cacheAge > 24 * 60 * 60 * 1000) {
        await this.delete(repoUrl)
        return null
      }

      return cached.data
    } catch {
      return null
    }
  }

  async set(repoUrl: string, data: any): Promise<void> {
    try {
      await this.ensureCacheDir()
      const cacheKey = this.getCacheKey(repoUrl)
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`)

      const cacheData = {
        timestamp: Date.now(),
        repoUrl,
        data,
      }

      await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2))
    } catch (error) {
      console.error("Failed to cache documentation:", error)
    }
  }

  async delete(repoUrl: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(repoUrl)
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`)
      await fs.unlink(cacheFile)
    } catch {
      // File might not exist
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir)
      await Promise.all(files.map((file) => fs.unlink(path.join(this.cacheDir, file))))
    } catch {
      // Directory might not exist
    }
  }
}
