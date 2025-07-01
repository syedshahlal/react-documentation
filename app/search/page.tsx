"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import AdvancedSearch from "@/components/advanced-search"

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Documentation</h1>
        <p className="text-gray-600">Find information across all documentation with advanced search and filtering</p>
      </div>

      <AdvancedSearch initialQuery={initialQuery} />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  )
}
