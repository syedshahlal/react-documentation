"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar, Tag } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface MarkdownFile {
  id: string
  title: string
  content: string
  path: string
  links: string[]
  backlinks: string[]
  metadata: {
    created: string
    modified: string
    tags?: string[]
  }
}

interface MarkdownViewerProps {
  file: MarkdownFile
  allFiles: MarkdownFile[]
  onNavigateToFile: (fileId: string) => void
}

export function MarkdownViewer({ file, allFiles, onNavigateToFile }: MarkdownViewerProps) {
  const renderMarkdownWithLinks = (text: string) => {
    return text.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
      const linkedFile = allFiles.find((f) => f.id === linkText || f.title === linkText)
      if (linkedFile) {
        return `[${linkText}](#${linkedFile.id})`
      }
      return `**${linkText}** (not found)`
    })
  }

  const handleLinkClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
      event.preventDefault()
      const fileId = target.getAttribute("href")?.substring(1)
      if (fileId) {
        onNavigateToFile(fileId)
      }
    }
  }

  const linkedFiles = file.links
    .map((linkId) => allFiles.find((f) => f.id === linkId || f.title === linkId))
    .filter(Boolean) as MarkdownFile[]

  const backlinkFiles = file.backlinks
    .map((backlinkId) => allFiles.find((f) => f.id === backlinkId))
    .filter(Boolean) as MarkdownFile[]

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{file.title}</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created: {new Date(file.metadata.created).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Modified: {new Date(file.metadata.modified).toLocaleDateString()}
                  </div>
                </div>
                {file.metadata.tags && file.metadata.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <div className="flex gap-1">
                      {file.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" onClick={handleLinkClick}>
              <ReactMarkdown>{renderMarkdownWithLinks(file.content)}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-80 space-y-4">
        {linkedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Linked Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {linkedFiles.map((linkedFile) => (
                <Button
                  key={linkedFile.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onNavigateToFile(linkedFile.id)}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  {linkedFile.title}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {backlinkFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Referenced By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {backlinkFiles.map((backlinkFile) => (
                <Button
                  key={backlinkFile.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onNavigateToFile(backlinkFile.id)}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  {backlinkFile.title}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Document Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <strong>Path:</strong> {file.path}
            </div>
            <div>
              <strong>Links:</strong> {file.links.length}
            </div>
            <div>
              <strong>Backlinks:</strong> {file.backlinks.length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
