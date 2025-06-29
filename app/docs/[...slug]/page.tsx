import { notFound } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { DocContent } from "@/components/doc-content"
import { Breadcrumb } from "@/components/breadcrumb"
import { PageNavigation } from "@/components/page-navigation"
import { Badge } from "@/components/ui/badge"
import { Book, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

// Navigation structure for determining next/previous pages
const navigationOrder = [
  { slug: "introduction", title: "Introduction to GRA Core Platform" },
  { slug: "user-guide", title: "User Guide" },
  { slug: "api-reference", title: "API Reference" },
  { slug: "examples", title: "Examples & Tutorials" },
  { slug: "development", title: "Development Guide" },
  { slug: "architecture", title: "Platform Architecture" },
]

// This would typically come from your markdown files
const getDocContent = async (slug: string[]) => {
  const slugPath = slug.join("/")

  // Mock content - in a real app, you'd read from markdown files
  const mockContent = {
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

Ready to dive deeper? Check out our [User Guide](/docs/user-guide) or explore our [API Reference](/docs/api-reference).`,
      lastUpdated: "2024-01-15",
    },
    "user-guide": {
      title: "User Guide",
      content: `# User Guide

This comprehensive user guide will walk you through all aspects of using GRA Core Platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Operations](#basic-operations)
3. [Advanced Features](#advanced-features)
4. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A valid GRA Core Platform account
- API credentials configured

### Installation

\`\`\`bash
npm install @gra-core/platform
\`\`\`

### Basic Configuration

\`\`\`javascript
import { GRACore } from '@gra-core/platform'

const client = new GRACore({
  apiKey: 'your-api-key',
  environment: 'production'
})
\`\`\`

## Basic Operations

### Creating Resources

Learn how to create and manage resources in the platform.

### Data Management

Understand how to efficiently manage your data with our APIs.

### Monitoring & Analytics

Set up monitoring and analytics for your applications.`,
      lastUpdated: "2024-01-14",
    },
    "api-reference": {
      title: "API Reference",
      content: `# API Reference

Complete reference for all GRA Core Platform APIs.

## Authentication

All API requests require authentication using API keys.

### Headers

\`\`\`
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
\`\`\`

## Endpoints

### Users API

#### GET /api/users

Retrieve a list of users.

**Parameters:**
- \`limit\` (optional): Number of users to return (default: 10)
- \`offset\` (optional): Number of users to skip (default: 0)

**Response:**
\`\`\`json
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
\`\`\`

#### POST /api/users

Create a new user.

**Request Body:**
\`\`\`json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
\`\`\`

### Data API

#### GET /api/data

Retrieve data from the platform.

#### POST /api/data

Submit new data to the platform.`,
      lastUpdated: "2024-01-13",
    },
    examples: {
      title: "Examples & Tutorials",
      content: `# Examples & Tutorials

Real-world examples and step-by-step tutorials for common use cases.

## Quick Start Examples

### Basic Setup

\`\`\`javascript
import { GRACore } from '@gra-core/platform'

const client = new GRACore({
  apiKey: process.env.GRA_API_KEY,
  environment: 'production'
})
\`\`\`

### Creating Your First Resource

\`\`\`javascript
const resource = await client.resources.create({
  name: 'My First Resource',
  type: 'data-source'
})
\`\`\`

## Advanced Examples

### Real-time Data Processing

Learn how to process data in real-time with our streaming APIs.

### Custom Integrations

Build custom integrations with third-party services.`,
      lastUpdated: "2024-01-12",
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

\`\`\`bash
git clone https://github.com/gra-core/platform
cd platform
npm install
npm run dev
\`\`\`

## Contributing

### Code Style

We use ESLint and Prettier for code formatting.

### Testing

Run tests with:

\`\`\`bash
npm test
\`\`\`

## Advanced Topics

### Custom Plugins

Learn how to create custom plugins for the platform.

### Performance Optimization

Best practices for optimizing your GRA Core applications.`,
      lastUpdated: "2024-01-11",
    },
    architecture: {
      title: "Platform Architecture",
      content: `# Platform Architecture

Deep dive into GRA Core Platform architecture and infrastructure.

## System Overview

The GRA Core Platform is built on a microservices architecture with the following components:

- **API Gateway**: Routes requests and handles authentication
- **Core Services**: Business logic and data processing
- **Data Layer**: Distributed database and caching
- **Message Queue**: Asynchronous processing and events

## Scalability

### Horizontal Scaling

The platform automatically scales based on demand.

### Load Balancing

Traffic is distributed across multiple instances.

## Security

### Authentication

Multi-factor authentication and OAuth 2.0 support.

### Data Encryption

All data is encrypted at rest and in transit.`,
      lastUpdated: "2024-01-10",
    },
  }

  return mockContent[slugPath] || null
}

const getPageNavigation = (currentSlug: string) => {
  const currentIndex = navigationOrder.findIndex((item) => item.slug === currentSlug)

  if (currentIndex === -1) return { previousPage: null, nextPage: null }

  const previousPage =
    currentIndex > 0
      ? {
          title: navigationOrder[currentIndex - 1].title,
          href: `/docs/${navigationOrder[currentIndex - 1].slug}`,
        }
      : null

  const nextPage =
    currentIndex < navigationOrder.length - 1
      ? {
          title: navigationOrder[currentIndex + 1].title,
          href: `/docs/${navigationOrder[currentIndex + 1].slug}`,
        }
      : null

  return { previousPage, nextPage }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const doc = await getDocContent(slug)

  if (!doc) {
    notFound()
  }

  const currentSlug = slug.join("/")
  const { previousPage, nextPage } = getPageNavigation(currentSlug)

  return (
    <div className="min-h-screen bg-slate-50 px-4 px-px px-[px] py-4 py-[px]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 lg:pl-80">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Book className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-slate-900">GRA Core Platform</h1>
                        <p className="text-sm text-slate-600">Documentation</p>
                      </div>
                    </div>
                  </div>

                  {/* Center Tabs */}
                  <div className="flex items-center space-x-8">
                    <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">About</button>
                    <button className="text-sm font-medium text-slate-600 hover:text-slate-900 pb-1">User Guide</button>
                    <button className="text-sm font-medium text-slate-600 hover:text-slate-900 pb-1">Example</button>
                    <button className="text-sm font-medium text-slate-600 hover:text-slate-900 pb-1">Create Doc</button>
                    <button className="text-sm font-medium text-slate-600 hover:text-slate-900 pb-1">GCP BOW</button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      v5.7 stable
                    </Badge>

                    {/* Theme Toggle Pill Button */}
                    <button className="flex items-center space-x-2 bg-slate-200 hover:bg-slate-300 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors">
                      <span className="w-4 h-4">🌙</span>
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
              </div>
            </header>

            {/* Add top padding to account for fixed header */}
            <div className="pt-24">
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-none">
                <Breadcrumb slug={slug} />

                <div className="flex flex-col gap-6 lg:gap-8">
                  <div className="flex-1 min-w-0">
                    <DocContent title={doc.title} content={doc.content} lastUpdated={doc.lastUpdated} />

                    {/* Page Navigation */}
                    <PageNavigation previousPage={previousPage} nextPage={nextPage} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  return [
    { slug: ["introduction"] },
    { slug: ["user-guide"] },
    { slug: ["api-reference"] },
    { slug: ["examples"] },
    { slug: ["development"] },
    { slug: ["architecture"] },
  ]
}
