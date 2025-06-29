"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, RefreshCw } from "lucide-react"
import { MarkdownTree } from "@/components/markdown-tree"
import { MarkdownEditor } from "@/components/markdown-editor"
import { MarkdownViewer } from "@/components/markdown-viewer"
import { useToast } from "@/hooks/use-toast"

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

interface TreeNode {
  id: string
  title: string
  path: string
  children: TreeNode[]
  links: string[]
  backlinks: string[]
}

export default function MarkdownManagerPage() {
  const [files, setFiles] = useState<MarkdownFile[]>([])
  const [tree, setTree] = useState<TreeNode[]>([])
  const [selectedFile, setSelectedFile] = useState<MarkdownFile | null>(null)
  const [editingFile, setEditingFile] = useState<MarkdownFile | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/markdown")
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files)
        setTree(data.tree)
      } else {
        throw new Error("Failed to fetch files")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch markdown files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleSelectFile = (node: TreeNode) => {
    const file = files.find((f) => f.id === node.id)
    if (file) {
      setSelectedFile(file)
      setEditingFile(null)
      setIsCreating(false)
    }
  }

  const handleEditFile = (node: TreeNode) => {
    const file = files.find((f) => f.id === node.id)
    if (file) {
      setEditingFile(file)
      setSelectedFile(null)
      setIsCreating(false)
    }
  }

  const handleDeleteFile = async (node: TreeNode) => {
    if (!confirm(`Are you sure you want to delete "${node.title}"?`)) {
      return
    }

    try {
      const pathParts = node.path.replace(".md", "").split("/")
      const response = await fetch(`/api/markdown/${pathParts.join("/")}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "File deleted successfully",
        })
        await fetchFiles()
        if (selectedFile?.id === node.id) {
          setSelectedFile(null)
        }
        if (editingFile?.id === node.id) {
          setEditingFile(null)
        }
      } else {
        throw new Error("Failed to delete file")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const handleSaveFile = async (path: string, title: string, content: string, tags: string[]) => {
    try {
      const isEditing = !!editingFile
      const url = isEditing
        ? `/api/markdown/${editingFile.path.replace(".md", "").split("/").join("/")}`
        : "/api/markdown"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path, title, content, tags }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `File ${isEditing ? "updated" : "created"} successfully`,
        })
        await fetchFiles()
        setEditingFile(null)
        setIsCreating(false)

        // Select the newly created/updated file
        const updatedFile = await response.json()
        setSelectedFile(updatedFile)
      } else {
        throw new Error(`Failed to ${isEditing ? "update" : "create"} file`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingFile ? "update" : "create"} file`,
        variant: "destructive",
      })
    }
  }

  const handleNavigateToFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (file) {
      setSelectedFile(file)
      setEditingFile(null)
      setIsCreating(false)
    }
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setSelectedFile(null)
    setEditingFile(null)
  }

  const handleCancelEdit = () => {
    setEditingFile(null)
    setIsCreating(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Markdown Manager</h1>
        <div className="flex gap-2">
          <Button onClick={fetchFiles} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        <div className="lg:col-span-1">
          <MarkdownTree
            tree={tree}
            onSelectFile={handleSelectFile}
            onEditFile={handleEditFile}
            onDeleteFile={handleDeleteFile}
            selectedFileId={selectedFile?.id}
          />
        </div>

        <div className="lg:col-span-3">
          {isCreating || editingFile ? (
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <MarkdownEditor
                  file={editingFile || undefined}
                  onSave={handleSaveFile}
                  onCancel={handleCancelEdit}
                  allFiles={files}
                />
              </CardContent>
            </Card>
          ) : selectedFile ? (
            <MarkdownViewer file={selectedFile} allFiles={files} onNavigateToFile={handleNavigateToFile} />
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-medium">No document selected</h3>
                  <p className="text-muted-foreground">
                    Select a document from the tree or create a new one to get started.
                  </p>
                  <Button onClick={handleCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
