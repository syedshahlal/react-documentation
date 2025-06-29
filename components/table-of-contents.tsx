"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TocItem {
  id: string
  title: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const headings: TocItem[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const title = match[2]
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      headings.push({ id, title, level })
    }

    setToc(headings)
  }, [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-20% 0% -35% 0%" },
    )

    const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    headingElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  if (toc.length === 0) return null

  return (
    <div className="sticky top-32 w-full">
      <div className="lg:fixed lg:right-8 lg:top-32 lg:w-64 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-4 shadow-sm lg:shadow-lg">
          <div className="text-sm">
            <h4 className="font-semibold text-slate-900 mb-4">On this page</h4>
            <nav>
              <ul className="space-y-2">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={cn(
                        "block py-1 text-slate-600 hover:text-slate-900 transition-colors",
                        item.level === 1 && "font-medium",
                        item.level === 2 && "pl-4",
                        item.level === 3 && "pl-8",
                        item.level >= 4 && "pl-12",
                        activeId === item.id && "text-blue-600 font-medium",
                      )}
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
