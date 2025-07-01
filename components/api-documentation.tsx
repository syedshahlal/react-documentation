"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Code, PackageIcon, FileText, TypeIcon as FunctionIcon, Settings, Search, Download, BookOpen, Zap, AlertCircle, CheckCircle, Loader2, Github, ExternalLink } from 'lucide-react'

interface DocString {
  description: string
  args: Array<{ name: string; description: string }>
  returns: string
  raises: string[]
  examples: string[]
  attributes: string[]
}

interface Method {
  name: string
  docstring: DocString
  args: string[]
  line_number: number
  is_private: boolean
  is_property: boolean
}

interface Class {
  name: string
  docstring: DocString
  methods: Method[]
  line_number: number
}

interface Function {
  name: string
  docstring: DocString
  args: string[]
  line_number: number
  is_private: boolean
}

interface Module {
  path: string
  module_name: string
  module_docstring: DocString
  classes: Class[]
  functions: Function[]
  constants: Array<{ name: string; value: string; line_number: number }>
}

interface SubPackage {
  name: string
  path: string
  init_module: Module
  modules: Module[]
  subpackages: SubPackage[]
}

interface Documentation {
  repository: string
  root_path: string
  packages: SubPackage[]
  generated_at: string
  total_packages: number
}

interface APIDocumentationProps {
  initialRepo?: string
}

const SAMPLE_REPOS = [
  {
    name: "Requests",
    url: "https://github.com/psf/requests",
    description: "HTTP library for Python",
    icon: "🌐"
  },
  {
    name: "Flask",
    url: "https://github.com/pallets/flask",
    description: "Lightweight web framework",
    icon: "🌶️"
  },
  {
    name: "FastAPI",
    url: "https://github.com/tiangolo/fastapi",
    description: "Modern web framework for APIs",
    icon: "⚡"
  },
  {
    name: "Django",
    url: "https://github.com/django/django",
    description: "High-level web framework",
    icon: "🎸"
  },
  {
    name: "NumPy",
    url: "https://github.com/numpy/numpy",
    description: "Scientific computing library",
    icon: "🔢"
  }
]

export default function APIDocumentation({ initialRepo = "" }: APIDocumentationProps) {
  const [repoUrl, setRepoUrl] = useState(initialRepo)
  const [documentation, setDocumentation] = useState<Documentation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  const generateDocumentation = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL or path")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      })

      const result = await response.json()

      if (result.success) {
        setDocumentation(result.documentation)
        if (result.documentation.packages.length > 0) {
          setSelectedPackage(result.documentation.packages[0].name)
        }
      } else {
        setError(result.error || "Failed to generate documentation")
      }
    } catch (err) {
      setError("Network error occurred while generating documentation")
    } finally {
      setLoading(false)
    }
  }

  const loadSampleRepo = (url: string) => {
    setRepoUrl(url)
    setError(null)
  }

  const renderDocString = (docstring: DocString) => {
    if (!docstring || !docstring.description) return null

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{docstring.description}</p>

        {docstring.args && docstring.args.length > 0 && (
          <div>
            <h5 className="font-semibold text-sm mb-2">Parameters:</h5>
            <ul className="space-y-1">
              {docstring.args.map((arg, index) => (
                <li key={index} className="text-sm">
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">{arg.name}</code>
                  {arg.description && <span className="ml-2 text-muted-foreground">{arg.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {docstring.returns && (
          <div>
            <h5 className="font-semibold text-sm mb-2">Returns:</h5>
            <p className="text-sm text-muted-foreground">{docstring.returns}</p>
          </div>
        )}

        {docstring.examples && docstring.examples.length > 0 && (
          <div>
            <h5 className="font-semibold text-sm mb-2">Examples:</h5>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{docstring.examples.join("\n")}</pre>
          </div>
        )}
      </div>
    )
  }

  const renderMethod = (method: Method) => (
    <Card key={method.name} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FunctionIcon className="w-4 h-4" />
            {method.name}
            {method.is_property && <Badge variant="secondary">property</Badge>}
            {method.is_private && <Badge variant="outline">private</Badge>}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Line {method.line_number}
          </Badge>
        </div>
        <CardDescription>
          <code className="text-xs">
            {method.name}({method.args.join(", ")})
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent>{renderDocString(method.docstring)}</CardContent>
    </Card>
  )

  const renderClass = (cls: Class) => (
    <Card key={cls.name} className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          {cls.name}
          <Badge variant="outline" className="text-xs">
            Line {cls.line_number}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderDocString(cls.docstring)}

        {cls.methods.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Methods ({cls.methods.length})
            </h4>
            <div className="space-y-4">{cls.methods.map(renderMethod)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderFunctionComponent = (func: Function) => (
    <Card key={func.name} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FunctionIcon className="w-4 h-4" />
            {func.name}
            {func.is_private && <Badge variant="outline">private</Badge>}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Line {func.line_number}
          </Badge>
        </div>
        <CardDescription>
          <code className="text-xs">
            {func.name}({func.args.join(", ")})
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent>{renderDocString(func.docstring)}</CardContent>
    </Card>
  )

  const renderModuleComponent = (module: Module) => (
    <div key={module.module_name} className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5" />
        <h3 className="text-xl font-semibold">{module.module_name}</h3>
      </div>

      {module.module_docstring && module.module_docstring.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Module Description</CardTitle>
          </CardHeader>
          <CardContent>{renderDocString(module.module_docstring)}</CardContent>
        </Card>
      )}

      {module.classes.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Classes ({module.classes.length})
          </h4>
          {module.classes.map(renderClass)}
        </div>
      )}

      {module.functions.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FunctionIcon className="w-4 h-4" />
            Functions ({module.functions.length})
          </h4>
          {module.functions.map(renderFunctionComponent)}
        </div>
      )}

      {module.constants.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Constants ({module.constants.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {module.constants.map((constant) => (
              <Card key={constant.name}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <code className="font-mono text-sm">{constant.name}</code>
                    <Badge variant="outline" className="text-xs">
                      Line {constant.line_number}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{constant.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderPackageComponent = (pkg: SubPackage) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <PackageIcon className="w-6 h-6" />
        <h2 className="text-2xl font-bold">{pkg.name}</h2>
      </div>

      {pkg.init_module && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              __init__.py
            </CardTitle>
          </CardHeader>
          <CardContent>{renderDocString(pkg.init_module.module_docstring)}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modules">Modules ({pkg.modules.length})</TabsTrigger>
          <TabsTrigger value="subpackages">Subpackages ({pkg.subpackages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          {pkg.modules.map(renderModuleComponent)}
        </TabsContent>

        <TabsContent value="subpackages" className="space-y-6">
          {pkg.subpackages.map((subpkg) => (
            <Card key={subpkg.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackageIcon className="w-4 h-4" />
                  {subpkg.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Modules: {subpkg.modules.length} | Subpackages: {subpkg.subpackages.length}
                </p>
                <Button variant="outline" size="sm" onClick={() => setSelectedPackage(subpkg.name)}>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )

  const filteredPackages =
    documentation?.packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.modules.some(
          (mod) =>
            mod.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mod.classes.some((cls) => cls.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            mod.functions.some((func) => func.name.toLowerCase().includes(searchTerm.toLowerCase())),
        ),
    ) || []

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Python API Documentation Generator
        </h1>
        <p className="text-muted-foreground mb-6">
          Generate comprehensive API documentation from any Python repository by analyzing docstrings and code structure.
        </p>

        {/* Sample Repositories */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Github className="w-5 h-5" />
            Try Sample Repositories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAMPLE_REPOS.map((repo) => (
              <Card key={repo.url} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{repo.icon}</span>
                      <h4 className="font-semibold">{repo.name}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadSampleRepo(repo.url)}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Enter repository URL or local path..."
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={generateDocumentation} disabled={loading} className="min-w-[120px]">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {documentation && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Documentation Generated Successfully
              </CardTitle>
              <CardDescription>
                Found {documentation.total_packages} packages in {documentation.repository}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Repository: {documentation.repository}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>Generated: {new Date(documentation.generated_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-6">
            <div className="w-1/4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Packages</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search packages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {filteredPackages.map((pkg) => (
                        <Button
                          key={pkg.name}
                          variant={selectedPackage === pkg.name ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setSelectedPackage(pkg.name)}
                        >
                          <PackageIcon className="w-4 h-4 mr-2" />
                          {pkg.name}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1">
              <ScrollArea className="h-[800px]">
                {selectedPackage && (
                  <div className="pr-4">
                    {filteredPackages.filter((pkg) => pkg.name === selectedPackage).map(renderPackageComponent)}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
