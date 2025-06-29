"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Eye, X, Plus } from "lucide-react"
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

interface MarkdownEditorProps {
  file?: MarkdownFile
  onSave: (path: string, title: string, content: string, tags: string[]) => Promise<void>
  onCancel: () => void
  allFiles: MarkdownFile[]
}

export function MarkdownEditor({ file, onSave, onCancel, allFiles }: MarkdownEditorProps) {
  const [title, setTitle] = useState(file?.title || "")
  const [content, setContent] = useState(file?.content || "")
  const [path, setPath] = useState(file?.path || "")
  const [tags, setTags] = useState<string[]>(file?.metadata.tags || [])
  const [newTag, setNewTag] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (file) {
      setTitle(file.title)
      setContent(file.content)
      setPath(file.path)
      setTags(file.metadata.tags || [])
    }
  }, [file])

  const handleSave = async () => {
    if (!title || !content) return

    setSaving(true)
    try {
      const finalPath = path || `${title.toLowerCase().replace(/\s+/g, "-")}.md`
      await onSave(finalPath, title, content, tags)
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const insertLink = (linkText: string) => {
    const linkMarkdown = `[[${linkText}]]`
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + linkMarkdown + content.substring(end)
      setContent(newContent)

      // Set cursor position after the inserted link
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + linkMarkdown.length, start + linkMarkdown.length)
      }, 0)
    }
  }

  const renderMarkdownWithLinks = (text: string) => {
    return text.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
      const linkedFile = allFiles.find((f) => f.id === linkText || f.title === linkText)
      if (linkedFile) {
        return `[${linkText}](/docs/${linkedFile.path.replace(".md", "")})`
      }
      return `**${linkText}** (not found)`
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{file ? "Edit Document" : "Create New Document"}</h2>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !title || !content}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          <div className="lg:col-span-2">
            <Tabs defaultValue="edit" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="flex-1 flex flex-col space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document title"
                  />
                </div>

                {!file && (
                  <div className="space-y-2">
                    <Label htmlFor="path">Path</Label>
                    <Input
                      id="path"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      placeholder="folder/filename.md (optional)"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button onClick={addTag} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your markdown content here..."
                    className="h-full min-h-[400px] font-mono"
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1">
                <div className="h-full overflow-auto border rounded-md p-4 bg-white">
                  <ReactMarkdown className="prose max-w-none">{renderMarkdownWithLinks(content)}</ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Click to insert link into content</p>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {allFiles.map((f) => (
                    <Button
                      key={f.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => insertLink(f.id)}
                    >
                      {f.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Link Syntax</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs space-y-1">
                  <p>
                    <code>[[file-id]]</code> - Link to another document
                  </p>
                  <p>
                    <code>[[Document Title]]</code> - Link by title
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
