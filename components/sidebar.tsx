"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, Search, FileText, Folder, FolderOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface DocItem {
  title: string
  path: string
  children?: DocItem[]
}

interface SidebarProps {
  className?: string
}

function Sidebar({ className }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [docStructure, setDocStructure] = useState<DocItem[]>([])
  const pathname = usePathname()

  useEffect(() => {
    fetch("/api/docs-structure")
      .then((res) => res.json())
      .then((data) => {
        setDocStructure(data)
        // Auto-expand items that contain the current path
        const pathsToExpand = new Set<string>()
        const findAndExpandPath = (items: DocItem[], currentPath: string) => {
          items.forEach((item) => {
            if (currentPath.startsWith(item.path)) {
              pathsToExpand.add(item.path)
              if (item.children) {
                findAndExpandPath(item.children, currentPath)
              }
            }
          })
        }
        findAndExpandPath(data, pathname)
        setExpandedItems(pathsToExpand)
      })
      .catch(console.error)
  }, [pathname])

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedItems(newExpanded)
  }

  const filterItems = (items: DocItem[], term: string): DocItem[] => {
    if (!term) return items

    return items.reduce((filtered: DocItem[], item) => {
      const matchesTitle = item.title.toLowerCase().includes(term.toLowerCase())
      const filteredChildren = item.children ? filterItems(item.children, term) : []

      if (matchesTitle || filteredChildren.length > 0) {
        filtered.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : item.children,
        })
      }

      return filtered
    }, [])
  }

  const renderDocItem = (item: DocItem, level = 0) => {
    const isExpanded = expandedItems.has(item.path)
    const isActive = pathname === item.path
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.path}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
            isActive && "bg-accent text-accent-foreground font-medium",
            level > 0 && "ml-4",
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpanded(item.path)} className="flex items-center gap-1 flex-1 text-left">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="truncate">{item.title}</span>
            </button>
          ) : (
            <Link href={item.path} className="flex items-center gap-2 flex-1">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">{item.children!.map((child) => renderDocItem(child, level + 1))}</div>
        )}
      </div>
    )
  }

  const filteredStructure = filterItems(docStructure, searchTerm)

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="py-4 space-y-1">{filteredStructure.map((item) => renderDocItem(item))}</div>
      </ScrollArea>
    </div>
  )
}

// Export both default and named exports
export default Sidebar
export { Sidebar }
