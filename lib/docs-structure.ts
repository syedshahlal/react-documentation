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
    href: "/docs/introduction",
    items: [],
  },
  {
    id: "user-guide",
    title: "User Guide",
    href: "/docs/user-guide",
    items: [
      {
        id: "local-setup",
        title: "Local Setup",
        href: "/docs/user-guide/local-setup",
        items: [],
      },
    ],
  },
  {
    id: "api-reference",
    title: "API Reference",
    href: "/docs/api-reference",
    items: [],
  },
  {
    id: "examples-tutorials",
    title: "Examples & Tutorials",
    href: "/docs/examples",
    items: [
      {
        id: "basic-setup",
        title: "Basic Setup",
        href: "/docs/examples/basic-setup",
        items: [],
      },
      {
        id: "user-authentication",
        title: "User Authentication",
        href: "/docs/examples/user-authentication",
        items: [],
      },
      {
        id: "data-management",
        title: "Data Management",
        href: "/docs/examples/data-management",
        items: [],
      },
    ],
  },
  {
    id: "development-guide",
    title: "Development Guide",
    href: "/docs/development",
    items: [
      {
        id: "security-best-practices",
        title: "Security Best Practices",
        href: "/docs/development/security-best-practices",
        items: [],
      },
      {
        id: "performance-optimization",
        title: "Performance Optimization",
        href: "/docs/development/performance-optimization",
        items: [],
      },
      {
        id: "advanced-monitoring",
        title: "Advanced Monitoring",
        href: "/docs/development/advanced-monitoring",
        items: [],
      },
    ],
  },
  {
    id: "gcp-feature-indepth",
    title: "GCP Feature InDepth",
    href: "/docs/architecture",
    items: [
      {
        id: "cloud-functions",
        title: "Cloud Functions",
        href: "/docs/architecture/cloud-functions",
        items: [],
      },
      {
        id: "cloud-storage",
        title: "Cloud Storage",
        href: "/docs/architecture/cloud-storage",
        items: [],
      },
    ],
  },
]

/**
 * Very small helper that returns Previous / Next based on
 * the order of markdown files in the docs/ folder.
 *
 * To reorder navigation, just change the `orderedHrefs` array.
 * When you add a new doc, push its route into the correct place.
 */

type NavLink = { href: string; title: string }

const orderedHrefs: NavLink[] = [
  { href: "/docs/introduction", title: "Introduction to GRA Core Platform" },
  { href: "/docs/user-guide", title: "User Guide" },
  { href: "/docs/api-reference", title: "API Reference" },
  { href: "/docs/examples", title: "Examples & Tutorials" },
  { href: "/docs/development", title: "Development Guide" },
  { href: "/docs/architecture", title: "Platform Architecture" },
]

export function getNavigation(currentHref: string) {
  const idx = orderedHrefs.findIndex((p) => p.href === currentHref)
  return {
    previousPage: idx > 0 ? orderedHrefs[idx - 1] : undefined,
    nextPage: idx !== -1 && idx < orderedHrefs.length - 1 ? orderedHrefs[idx + 1] : undefined,
  }
}

/**
 * Expose the flat list if the sidebar or any other component needs it.
 */
export const flatDocsList = orderedHrefs
