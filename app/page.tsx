import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Code, Layers, Wrench, Database, ArrowRight, Search, Menu, Book } from "lucide-react"
import Link from "next/link"
import { Banner } from "@/components/banner"
import Image from "next/image"

const documentationSections = [
  {
    title: "GRA Core Platform Introduction",
    description: "Get started with GRA Core Platform fundamentals and core concepts.",
    icon: Book,
    href: "/docs/introduction",
    color: "bg-blue-500",
  },
  {
    title: "User Guide",
    description: "Complete guide to using GRA Core Platform with step-by-step instructions.",
    icon: Users,
    href: "/docs/user-guide",
    color: "bg-green-500",
  },
  {
    title: "API Reference",
    description: "Comprehensive API documentation with examples and authentication guides.",
    icon: Code,
    href: "/docs/api-reference",
    color: "bg-purple-500",
  },
  {
    title: "Examples & Tutorials",
    description: "Real-world examples and step-by-step tutorials for common use cases.",
    icon: Layers,
    href: "/docs/examples",
    color: "bg-orange-500",
  },
  {
    title: "Development Guide",
    description: "Development workflows, contribution guidelines, and advanced topics.",
    icon: Wrench,
    href: "/docs/development",
    color: "bg-cyan-500",
  },
  {
    title: "Platform Architecture",
    description: "Deep dive into GRA Core Platform architecture and infrastructure.",
    icon: Database,
    href: "/docs/architecture",
    color: "bg-indigo-500",
  },
]

const seeAlsoLinks = [
  { title: "Getting Started", href: "/docs/getting-started" },
  { title: "API Reference", href: "/docs/api" },
  { title: "Changelog", href: "/docs/changelog" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Announcement Bar - Always visible at the top */}
      <Banner />

      {/* Header - Fixed below the banner */}
      <header className="fixed top-12 left-0 right-0 z-50 border-b bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image src="/BAC.png" alt="BAC Logo" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">GRA Core Platform</h1>
              <p className="text-xs text-slate-600">Documentation</p>
            </div>
          </Link>

          {/* Center Navigation Tabs */}
          <div className="flex items-center space-x-8">
            <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">About</button>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 pb-1">User Guide</button>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 pb-1">Example</button>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 pb-1">Create Doc</button>
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 pb-1">GCP BOW</button>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
              v5.7 stable
            </Badge>
            <button className="flex items-center space-x-2 bg-slate-200 hover:bg-slate-300 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors">
              <span className="text-sm">🌙</span>
              <span>Dark</span>
            </button>
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm" className="md:hidden bg-transparent">
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Adjusted padding for banner + header */}
      <main className="container mx-auto px-4 py-12 pt-32">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GRA Core Platform Documentation
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive documentation and guides to help you master GRA Core Platform with our enterprise-grade tools
            and workflows.
          </p>
        </div>

        {/* Documentation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {documentationSections.map((section, index) => {
            const IconComponent = section.icon
            return (
              <Link key={index} href={section.href}>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div
                        className={`w-12 h-12 ${section.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 leading-relaxed">{section.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Start Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-16 border border-blue-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Need help getting started?</h2>
            <p className="text-slate-600 mb-6">Jump right into our comprehensive quick start guide</p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Link href="/docs/quick-start">
                Quick Start Guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* See Also Section */}
        <div className="border-t pt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">See Also</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {seeAlsoLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <div className="group p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {link.title}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600">
            <p>&copy; 2024 GRA Core Platform. Built with Next.js and MDX.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
