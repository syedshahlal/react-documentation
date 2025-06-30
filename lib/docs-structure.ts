// This file provides a static representation of the docs folder structure
// It's used for navigation and determining previous/next pages

export interface DocItem {
  id: string
  title: string
  href: string
  items?: DocItem[]
}

// This structure represents the actual files in the docs/ folder
// It's manually maintained but matches the folder structure
export const docsStructure: DocItem[] = [
  {
    id: "gra-core-platform-introduction",
    title: "GRA Core Platform Introduction",
    href: "/docs/01_GRA_Core_Platform Introduction/introduction",
    items: [],
  },
  {
    id: "user-guide",
    title: "User Guide",
    href: "/docs/02_User Guide/user-guide",
    items: [
      {
        id: "local-setup",
        title: "Local Setup",
        href: "/docs/02_User Guide/Local_setup/getting-started",
        items: [],
      },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    href: "/docs/03_API Reference/api-reference",
    items: [],
  },
  {
    id: "examples-tutorials",
    title: "Examples & Tutorials",
    href: "/docs/04_Examples & Tutorials",
    items: [
      {
        id: "basic-setup",
        title: "Basic Setup",
        href: "/docs/04_Examples & Tutorials/basic-setup",
        items: [],
      },
      {
        id: "user-authentication",
        title: "User Authentication",
        href: "/docs/04_Examples & Tutorials/user-authentication",
        items: [],
      },
      {
        id: "data-management",
        title: "Data Management",
        href: "/docs/04_Examples & Tutorials/data-management",
        items: [],
      },
    ],
  },
  {
    id: "development-guide",
    title: "Development Guide",
    href: "/docs/05_Development Guide",
    items: [
      {
        id: "security-best-practices",
        title: "Security Best Practices",
        href: "/docs/05_Development Guide/security-best-practices",
        items: [],
      },
      {
        id: "performance-optimization",
        title: "Performance Optimization",
        href: "/docs/05_Development Guide/performance-optimization",
        items: [],
      },
      {
        id: "advanced-monitoring",
        title: "Advanced Monitoring",
        href: "/docs/05_Development Guide/advanced-monitoring",
        items: [],
      },
    ],
  },
  {
    id: "gcp-feature-indepth",
    title: "GCP Feature InDepth",
    href: "/docs/06_GCP Feature InDepth",
    items: [
      {
        id: "cloud-functions",
        title: "Cloud Functions",
        href: "/docs/06_GCP Feature InDepth/cloud-functions",
        items: [],
      },
      {
        id: "cloud-storage",
        title: "Cloud Storage",
        href: "/docs/06_GCP Feature InDepth/cloud-storage",
        items: [],
      },
    ],
  },
]

// Flatten the docs structure into a single array for easier navigation
export function getFlattenedDocs(): { title: string; href: string }[] {
  const flattenedDocs: { title: string; href: string }[] = []

  function flatten(items: DocItem[]) {
    for (const item of items) {
      flattenedDocs.push({
        title: item.title,
        href: item.href,
      })

      if (item.items && item.items.length > 0) {
        flatten(item.items)
      }
    }
  }

  flatten(docsStructure)
  return flattenedDocs
}

// Get the previous and next pages for a given href
export function getNavigation(currentHref: string) {
  const flatDocs = getFlattenedDocs()
  const currentIndex = flatDocs.findIndex((doc) => doc.href === currentHref)

  return {
    previousPage: currentIndex > 0 ? flatDocs[currentIndex - 1] : undefined,
    nextPage: currentIndex < flatDocs.length - 1 ? flatDocs[currentIndex + 1] : undefined,
  }
}
