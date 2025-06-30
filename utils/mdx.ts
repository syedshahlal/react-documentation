import path from "path"
import fs from "fs/promises"
import matter from "gray-matter"

/**
 * Try to locate a Markdown/MDX document for a given slug array.
 * Search order:
 *   1.  docs/<slug>.md(x)               (exact path)
 *   2.  docs/<slug>/index.md(x)
 *   3.  docs/gcp-5.7/<slug>.md(x)       (prefixed)
 *   4.  docs/gcp-5.7/<slug>/index.md(x)
 *   5.  If slug already starts with gcp-5.7, also try WITHOUT the prefix.
 */
async function findDocPath(slugParts: string[]): Promise<string | null> {
  const docsRoot = path.join(process.cwd(), "docs")
  const slugPath = path.join(...slugParts)

  const candidates: string[] = [
    path.join(docsRoot, `${slugPath}.md`),
    path.join(docsRoot, `${slugPath}.mdx`),
    path.join(docsRoot, slugPath, "index.md"),
    path.join(docsRoot, slugPath, "index.mdx"),
  ]

  // add prefixed variants
  if (!slugParts[0]?.startsWith("gcp-5.7")) {
    const prefixed = path.join("gcp-5.7", slugPath)
    candidates.push(
      path.join(docsRoot, `${prefixed}.md`),
      path.join(docsRoot, `${prefixed}.mdx`),
      path.join(docsRoot, prefixed, "index.md"),
      path.join(docsRoot, prefixed, "index.mdx"),
    )
  }

  // if slug already has prefix, also search without it
  if (slugParts[0] === "gcp-5.7") {
    const without = path.join(...slugParts.slice(1))
    candidates.push(
      path.join(docsRoot, `${without}.md`),
      path.join(docsRoot, `${without}.mdx`),
      path.join(docsRoot, without, "index.md"),
      path.join(docsRoot, without, "index.mdx"),
    )
  }

  for (const file of candidates) {
    try {
      await fs.access(file)
      return file
    } catch {
      /* not found – continue */
    }
  }
  return null
}

type Frontmatter = Record<string, any>
type LoadResult = { content: string | null; frontmatter: Frontmatter }

/**
 * Load a document given its slug parts.
 * Returns `{ content: string | null, frontmatter }`.
 */
export async function getDocFromParams(slug: string[]): Promise<LoadResult> {
  const filePath = await findDocPath(slug)
  if (!filePath) return { content: null, frontmatter: {} }

  const raw = await fs.readFile(filePath, "utf8")
  const { content, data } = matter(raw)

  return { content, frontmatter: data }
}
