"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronDown, File, Folder, Edit, Trash2 } from "lucide-react"

interface TreeNode {
  id: string
  title: string
  path: string
  children: TreeNode[]
  links: string[]
  backlinks: string[]
}

interface MarkdownTreeProps {
  tree: TreeNode[]
  onSelectFile: (node: TreeNode) => void
  onEditFile: (node: TreeNode) => void
  onDeleteFile: (node: TreeNode) => void
  selectedFileId?: string
}

export function MarkdownTree({ tree, onSelectFile, onEditFile, onDeleteFile, selectedFileId }: MarkdownTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const isFile = node.path.endsWith(".md")
    const isSelected = selectedFileId === node.id

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
            isSelected ? "bg-accent" : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {hasChildren && (
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => toggleExpanded(node.id)}>
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}

          {!hasChildren && <div className="w-4" />}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isFile ? (
              <File className="h-4 w-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            )}

            <span className="truncate flex-1 text-sm" onClick={() => isFile && onSelectFile(node)}>
              {node.title}
            </span>

            {node.links.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {node.links.length} links
              </Badge>
            )}

            {node.backlinks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {node.backlinks.length} refs
              </Badge>
            )}
          </div>

          {isFile && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditFile(node)
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteFile(node)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>}
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Document Tree</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-auto">
          {tree.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No documents found. Create your first document to get started.
            </div>
          ) : (
            tree.map((node) => renderNode(node))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
