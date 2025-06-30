import { notFound } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { DocContent } from "@/components/doc-content"
import { Breadcrumb } from "@/components/breadcrumb"
import { PageNavigation } from "@/components/page-navigation"
import { TableOfContents } from "@/components/table-of-contents"
import { Header } from "@/components/header"
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { getPageNavigation } from "@/lib/docs-navigation"

// Function to get page navigation
// async function getPageNavigation(currentHref: string) {
//   const flat = await getFlatDocList()
//   const idx = flat.findIndex((d) => d.href === currentHref)
//   return {
//     previousPage: idx > 0 ? flat[idx - 1] : undefined,
//     nextPage: idx !== -1 && idx < flat.length - 1 ? flat[idx + 1] : undefined,
//   }
// }

// Tries to load a real Markdown file from the docs folder.
// Falls back to the previous mockContent object if the file is not found.
async function getDocContent(slug: string[]) {
  const docsDir = path.join(process.cwd(), "docs")

  // Try different possible file paths
  const possiblePaths = [
    path.join(docsDir, ...slug) + ".md",
    path.join(docsDir, ...slug, "index.md"),
    // Handle numbered prefixes
    path.join(docsDir, `01_${slug[0]}`, ...slug.slice(1)) + ".md",
    path.join(docsDir, `02_${slug[0]}`, ...slug.slice(1)) + ".md",
    path.join(docsDir, `03_${slug[0]}`, ...slug.slice(1)) + ".md",
    path.join(docsDir, `04_${slug[0]}`, ...slug.slice(1)) + ".md",
    path.join(docsDir, `05_${slug[0]}`, ...slug.slice(1)) + ".md",
    path.join(docsDir, `06_${slug[0]}`, ...slug.slice(1)) + ".md",
  ]

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8")
      const { data: frontmatter, content: markdownContent } = matter(content)

      return {
        title: frontmatter.title || slug[slug.length - 1].replace(/-/g, " "),
        description: frontmatter.description || "",
        content: markdownContent,
        frontmatter,
      }
    }
  }

  // Fallback content for demo purposes
  return {
    title: slug[slug.length - 1].replace(/-/g, " "),
    description: "Documentation page",
    content: `# ${slug[slug.length - 1].replace(/-/g, " ")}\n\nThis is a placeholder page for ${slug.join("/")}.\n\nContent will be loaded from the corresponding markdown file.`,
    frontmatter: {},
  }
}

export default async function DocPage({ params }: { params: { slug: string[] } }) {
  const { slug } = params
  const doc = await getDocContent(slug)

  if (!doc) {
    notFound()
  }

  const currentHref = `/docs/${slug.join("/")}`
  const navigation = await getPageNavigation(currentHref)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />

      <div className="flex">
        {/* Fixed Left Sidebar */}
        <div className="fixed left-0 top-0 bottom-0 w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto pt-20">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 ml-80 mr-80">
          <div className="max-w-none px-8 py-6">
            <Breadcrumb slug={slug} />

            <div className="mt-6">
              <DocContent title={doc.title} content={doc.content} description={doc.description} />

              <PageNavigation previous={navigation.previous} next={navigation.next} />
            </div>
          </div>
        </main>

        {/* Fixed Right Sidebar - Table of Contents */}
        <div className="fixed right-0 top-0 bottom-0 w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto pt-20">
          <div className="p-6">
            <TableOfContents content={doc.content} />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  // Pre-generate only the main top-level pages; everything else is rendered on demand.
  return [
    { slug: ["introduction"] },
    { slug: ["user-guide"] },
    { slug: ["api-reference"] },
    { slug: ["examples"] },
    { slug: ["development"] },
    { slug: ["architecture"] },
  ]
}
