/**
 * Temporary mock content until every page is backed by a real markdown file.
 * Replace individual entries with `fs`-read markdown or MDX as you migrate.
 */
export interface DocEntry {
  title: string
  content: string
  lastUpdated: string
}

export const mockContent: Record<string, DocEntry> = {
  introduction: {
    title: "Introduction to GRA Core Platform",
    content: `# Introduction to GRA Core Platform

Welcome to the **GRA Core Platform** documentation.  
This guide explains what the platform is, why you might use it, and how to get started.

## Key Features

- **High Performance** – Built for scale with enterprise-grade performance.
- **Security First** – Advanced security features and compliance standards.
- **Developer Friendly** – Intuitive APIs and extensive tooling.
- **Flexible Architecture** – Modular design that adapts to your needs.

## Next Steps

Head over to the [User Guide](/docs/user-guide) to dive in or check the [API Reference](/docs/api-reference) if you prefer to start from code.`,
    lastUpdated: "2024-01-15",
  },

  "user-guide": {
    title: "User Guide",
    content: `# User Guide

Everything you need to **install, configure and operate** the platform.

1. [Getting Started](#getting-started)  
2. [Basic Operations](#basic-operations)  
3. [Troubleshooting](#troubleshooting)

## Getting Started

Run:

\`\`\`bash
npm install @gra-core/platform
\`\`\`

…and you're off!`,
    lastUpdated: "2024-01-14",
  },

  "api-reference": {
    title: "API Reference",
    content: `# API Reference

Full reference of REST and client SDK endpoints.

> Tip: use the language picker in the top-right of each API method to switch code samples.`,
    lastUpdated: "2024-01-13",
  },

  examples: {
    title: "Examples & Tutorials",
    content: `# Examples & Tutorials

Copy-paste snippets and step-by-step tutorials for common tasks.`,
    lastUpdated: "2024-01-12",
  },

  development: {
    title: "Development Guide",
    content: `# Development Guide

Guidance for contributing and running the platform locally.`,
    lastUpdated: "2024-01-11",
  },

  architecture: {
    title: "Platform Architecture",
    content: `# Platform Architecture

Deep dive into how everything fits together.`,
    lastUpdated: "2024-01-10",
  },
}
