"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { generateDocsNavigation, type DocSection } from "@/lib/docs-navigation"

export function Sidebar() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [navigation, setNavigation] = useState<DocSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNavigation() {
      try {
        const nav = await generateDocsNavigation()
        setNavigation(nav)
      } catch (error) {
        console.error("Failed to load navigation:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNavigation()
  }, [])

  const filteredNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          searchQuery === "" ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.children?.some((child) => child.title.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    }))
    .filter((section) => section.items.length > 0)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Fixed Search Header */}
      <div className="fixed top-20 left-0 w-80 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable Navigation Content */}
      <ScrollArea className="flex-1 pt-16">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-center text-slate-500 py-8">Loading navigation...</div>
          ) : filteredNavigation.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              {searchQuery ? "No results found" : "No documentation found"}
            </div>
          ) : (
            filteredNavigation.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3 px-2">{section.title}</h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-2 py-2 text-sm rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                          pathname === item.href
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                            : "text-slate-700 dark:text-slate-300",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{item.title}</div>
                        </div>
                      </Link>
                      {item.children && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                                pathname === child.href
                                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                                  : "text-slate-600 dark:text-slate-400",
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{child.title}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )

  return <SidebarContent />
}
