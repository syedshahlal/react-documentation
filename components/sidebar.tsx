"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Book, Users, Code, Layers, Wrench, Database, ChevronDown, ChevronRight, Home, Search, X } from "lucide-react"

const navigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs/introduction", icon: Book },
      { title: "Quick Start", href: "/docs/quick-start", icon: Home },
      { title: "Installation", href: "/docs/installation", icon: Wrench },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "User Guide", href: "/docs/user-guide", icon: Users },
      { title: "Development Guide", href: "/docs/development", icon: Wrench },
      { title: "Examples & Tutorials", href: "/docs/examples", icon: Layers },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "API Reference", href: "/docs/api-reference", icon: Code },
      { title: "Platform Architecture", href: "/docs/architecture", icon: Database },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(["Getting Started", "Guides", "Reference"])
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]))
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button variant="outline" className="w-full bg-transparent" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Search docs...
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-2">
          {navigation.map((section) => (
            <div key={section.title}>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto font-medium text-slate-700 hover:text-slate-900"
                onClick={() => toggleSection(section.title)}
              >
                {section.title}
                {expandedSections.includes(section.title) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>

              {expandedSections.includes(section.title) && (
                <div className="ml-2 mt-1 space-y-1">
                  {section.items.map((item) => {
                    const IconComponent = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start p-2 h-auto text-sm",
                            isActive
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                          )}
                          onClick={() => setIsMobileOpen(false)}
                        >
                          <IconComponent className="w-4 h-4 mr-2" />
                          {item.title}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 z-40 pt-24">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Documentation</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
