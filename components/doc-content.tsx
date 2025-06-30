import { Badge } from "@/components/ui/badge"
import { Clock, User, Calendar, Tag } from "lucide-react"

interface DocMetadata {
  title?: string
  description?: string
  author?: string
  lastUpdated?: string
  tags?: string[]
  difficulty?: "beginner" | "intermediate" | "advanced"
  estimatedReadTime?: number
  [key: string]: any
}

interface DocContentProps {
  title: string
  content: string
  lastUpdated: string
  metadata?: DocMetadata
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function DocContent({ title, content, lastUpdated, metadata }: DocContentProps) {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      {/* Document Header */}
      <div className="not-prose mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">{title}</h1>

        {metadata?.description && (
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-6">{metadata.description}</p>
        )}

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          {metadata?.author && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{metadata.author}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Updated {new Date(lastUpdated).toLocaleDateString()}</span>
          </div>

          {metadata?.estimatedReadTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{metadata.estimatedReadTime} min read</span>
            </div>
          )}

          {metadata?.difficulty && (
            <Badge variant="outline" className={`${difficultyColors[metadata.difficulty]} border-0`}>
              {metadata.difficulty}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {metadata?.tags && metadata.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <Tag className="w-4 h-4 text-slate-500" />
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Content */}
      <div className="prose-headings:scroll-mt-20" dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  )
}
