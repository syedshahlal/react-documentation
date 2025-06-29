"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageNavigationProps {
  previousPage?: {
    title: string
    href: string
  }
  nextPage?: {
    title: string
    href: string
  }
}

export function PageNavigation({ previousPage, nextPage }: PageNavigationProps) {
  if (!previousPage && !nextPage) return null

  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-200">
      <div className="flex-1">
        {previousPage && (
          <Link href={previousPage.href}>
            <Button variant="ghost" className="group p-4 h-auto flex-col items-start hover:bg-slate-50">
              <div className="flex items-center text-sm text-slate-600 mb-1 group-hover:text-slate-900">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </div>
              <div className="font-medium text-slate-900 group-hover:text-blue-600">{previousPage.title}</div>
            </Button>
          </Link>
        )}
      </div>

      <div className="flex-1 flex justify-end">
        {nextPage && (
          <Link href={nextPage.href}>
            <Button variant="ghost" className="group p-4 h-auto flex-col items-end hover:bg-slate-50">
              <div className="flex items-center text-sm text-slate-600 mb-1 group-hover:text-slate-900">
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
              <div className="font-medium text-slate-900 group-hover:text-blue-600">{nextPage.title}</div>
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
