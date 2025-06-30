import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "GRA Core Platform Documentation",
  description: "Created with Next.js + MDX",
  generator: "GRA Tech",
  icons: {
  icon: [
    { url: "/favicon-light.png", media: "(prefers-color-scheme: light)" },
    { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
  ],
},
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
