"use client"

import type React from "react"

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

// Mock markdown content - in a real app, this would be loaded from your actual .md files
const markdownContent = {
  introduction: {
    title: "Introduction to GRA Core Platform",
    content: `# Introduction to GRA Core Platform

Welcome to the GRA Core Platform documentation. This comprehensive guide will help you understand and implement our enterprise-grade platform.

## What is GRA Core Platform?

GRA Core Platform is a powerful, scalable solution designed for modern enterprises. It provides:

- **High Performance**: Built for scale with enterprise-grade performance
- **Security First**: Advanced security features and compliance standards
- **Developer Friendly**: Intuitive APIs and comprehensive documentation
- **Flexible Architecture**: Modular design that adapts to your needs

## Getting Started

To begin using GRA Core Platform, you'll need to:

1. Set up your development environment
2. Configure your API credentials
3. Install the required dependencies
4. Run your first example

## Key Features

### Authentication & Authorization
Secure authentication system with role-based access control.

### Real-time Data Processing
Process and analyze data in real-time with our streaming architecture.

### Scalable Infrastructure
Auto-scaling capabilities that grow with your business needs.

## Next Steps

Ready to dive deeper? Check out our User Guide or explore our API Reference.`,
    href: "/docs/introduction",
  },
  "user-guide": {
    title: "User Guide",
    content: `# User Guide

This comprehensive user guide will walk you through all aspects of using GRA Core Platform.

## Table of Contents

1. Getting Started
2. Basic Operations
3. Advanced Features
4. Troubleshooting

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A valid GRA Core Platform account
- API credentials configured

### Installation

npm install @gra-core/platform

### Basic Configuration

import { GRACore } from '@gra-core/platform'

const client = new GRACore({
  apiKey: 'your-api-key',
  environment: 'production'
})

## Basic Operations

### Creating Resources

Learn how to create and manage resources in the platform.

### Data Management

Understand how to efficiently manage your data with our APIs.

### Monitoring & Analytics

Set up monitoring and analytics for your applications.

## Authentication Setup

Configure authentication for your application using OAuth 2.0 or API keys.

## Database Configuration

Set up your database connections and manage data persistence.`,
    href: "/docs/user-guide",
  },
  "api-reference": {
    title: "API Reference",
    content: `# API Reference

Complete reference for all GRA Core Platform APIs.

## Authentication

All API requests require authentication using API keys.

### Headers

Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

## Endpoints

### Users API

#### GET /api/users

Retrieve a list of users.

Parameters:
- limit (optional): Number of users to return (default: 10)
- offset (optional): Number of users to skip (default: 0)

Response:
{
  "users": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "has_more": false
}

#### POST /api/users

Create a new user.

Request Body:
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}

### Data API

#### GET /api/data

Retrieve data from the platform.

#### POST /api/data

Submit new data to the platform.

## API Keys

Manage your API keys through the dashboard or programmatically.

## Rate Limiting

All API endpoints are rate limited to ensure fair usage.`,
    href: "/docs/api-reference",
  },
  examples: {
    title: "Examples & Tutorials",
    content: `# Examples & Tutorials

Real-world examples and step-by-step tutorials for common use cases.

## Quick Start Examples

### Basic Setup

import { GRACore } from '@gra-core/platform'

const client = new GRACore({
  apiKey: process.env.GRA_API_KEY,
  environment: 'production'
})

### Creating Your First Resource

const resource = await client.resources.create({
  name: 'My First Resource',
  type: 'data-source'
})

## Advanced Examples

### Real-time Data Processing

Learn how to process data in real-time with our streaming APIs.

### Custom Integrations

Build custom integrations with third-party services.

### Authentication Examples

Examples of implementing authentication in different frameworks.

### Database Integration

Connect your application to various database systems.`,
    href: "/docs/examples",
  },
  development: {
    title: "Development Guide",
    content: `# Development Guide

Development workflows, contribution guidelines, and advanced topics.

## Development Environment

### Prerequisites

- Node.js 18+
- Docker
- Git

### Setup

git clone https://github.com/gra-core/platform
cd platform
npm install
npm run dev

## Contributing

### Code Style

We use ESLint and Prettier for code formatting.

### Testing

Run tests with:

npm test

## Advanced Topics

### Custom Plugins

Learn how to create custom plugins for the platform.

### Performance Optimization

Best practices for optimizing your GRA Core applications.

### Debugging

Tools and techniques for debugging your applications.

### Deployment

Deploy your applications to various cloud platforms.`,
    href: "/docs/development",
  },
  architecture: {
    title: "Platform Architecture",
    content: `# Platform Architecture

Deep dive into GRA Core Platform architecture and infrastructure.

## System Overview

The GRA Core Platform is built on a microservices architecture with the following components:

- API Gateway: Routes requests and handles authentication
- Core Services: Business logic and data processing
- Data Layer: Distributed database and caching
- Message Queue: Asynchronous processing and events

## Scalability

### Horizontal Scaling

The platform automatically scales based on demand.

### Load Balancing

Traffic is distributed across multiple instances.

## Security

### Authentication

Multi-factor authentication and OAuth 2.0 support.

### Data Encryption

All data is encrypted at rest and in transit.

### Network Security

Secure network configurations and firewall rules.

## Database Architecture

Learn about our database design and optimization strategies.`,
    href: "/docs/architecture",
  },
}

export function Sidebar() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(["Getting Started", "Guides", "Reference"])
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]))
  }

  const searchMarkdownContent = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const results: any[] = []
    const queryLower = query.toLowerCase()

    // Search through navigation items
    navigation.forEach((section) => {
      section.items.forEach((item) => {
        if (item.title.toLowerCase().includes(queryLower)) {
          results.push({
            ...item,
            section: section.title,
            type: "navigation",
            snippet: `Found in ${section.title} navigation`,
          })
        }
      })
    })

    // Search through markdown content
    Object.entries(markdownContent).forEach(([key, doc]) => {
      const titleMatch = doc.title.toLowerCase().includes(queryLower)
      const contentMatch = doc.content.toLowerCase().includes(queryLower)

      if (titleMatch || contentMatch) {
        // Extract relevant snippets from content
        const lines = doc.content.split("\n")
        const matchingLines = lines.filter((line) => line.toLowerCase().includes(queryLower) && line.trim().length > 0)

        // Get the first few matching lines as snippets
        const snippets = matchingLines
          .slice(0, 3)
          .map((line) => {
            const index = line.toLowerCase().indexOf(queryLower)
            if (index !== -1) {
              const start = Math.max(0, index - 30)
              const end = Math.min(line.length, index + queryLower.length + 30)
              let snippet = line.substring(start, end)

              // Add ellipsis if truncated
              if (start > 0) snippet = "..." + snippet
              if (end < line.length) snippet = snippet + "..."

              // Highlight the search term
              const regex = new RegExp(`(${query})`, "gi")
              snippet = snippet.replace(regex, "**$1**")

              return snippet.replace(/^#+\s*/, "").trim() // Remove markdown headers
            }
            return line.trim()
          })
          .filter((snippet) => snippet.length > 0)

        results.push({
          title: doc.title,
          href: doc.href,
          type: "content",
          section: "Documentation",
          snippets: snippets.length > 0 ? snippets : [`Found "${query}" in ${doc.title}`],
          icon: Book,
        })
      }
    })

    // Remove duplicates and sort by relevance
    const uniqueResults = results.filter(
      (result, index, self) => index === self.findIndex((r) => r.href === result.href && r.type === result.type),
    )

    // Sort by relevance (title matches first, then content matches)
    uniqueResults.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(queryLower)
      const bTitle = b.title.toLowerCase().includes(queryLower)

      if (aTitle && !bTitle) return -1
      if (!aTitle && bTitle) return 1
      return 0
    })

    setSearchResults(uniqueResults)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    searchMarkdownContent(query)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setIsSearching(false)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation / Search Results */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-2">
          {isSearching && searchResults.length > 0 ? (
            // Search Results
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Search Results ({searchResults.length})
              </h3>
              {searchResults.map((result, index) => {
                const IconComponent = result.icon || Search
                return (
                  <Link key={index} href={result.href}>
                    <div
                      className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsMobileOpen(false)
                        clearSearch()
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className="w-4 h-4 mt-0.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">{result.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{result.section}</div>
                          {result.snippets && (
                            <div className="space-y-1">
                              {result.snippets.slice(0, 2).map((snippet: string, snippetIndex: number) => (
                                <div
                                  key={snippetIndex}
                                  className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2"
                                  dangerouslySetInnerHTML={{
                                    __html: snippet.replace(
                                      /\*\*(.*?)\*\*/g,
                                      '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>',
                                    ),
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : isSearching && searchResults.length === 0 ? (
            // No Results
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No results found for "{searchQuery}"</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Try different keywords or check spelling
              </p>
            </div>
          ) : (
            // Default Navigation
            navigation.map((section) => (
              <div key={section.title}>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600 dark:border-blue-400"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800",
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
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-40 pt-16">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Documentation</h2>
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
