"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Book, Users, Code, Layers, Wrench, Database, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Banner } from "@/components/banner"
import { Header } from "@/components/header"

const featureCards = [
  {
    title: "Cloud-Native Architecture",
    description:
      "Built on modern cloud infrastructure with auto-scaling, high availability, and enterprise-grade security.",
    icon: Layers,
    color: "bg-blue-500",
    features: ["Auto-scaling", "99.9% Uptime", "Enterprise Security"],
  },
  {
    title: "Developer Experience",
    description:
      "Intuitive APIs, comprehensive SDKs, and powerful developer tools to accelerate your development workflow.",
    icon: Code,
    color: "bg-green-500",
    features: ["RESTful APIs", "Multiple SDKs", "CLI Tools"],
  },
  {
    title: "Real-time Analytics",
    description:
      "Advanced analytics and monitoring with real-time insights, custom dashboards, and intelligent alerts.",
    icon: Database,
    color: "bg-purple-500",
    features: ["Live Dashboards", "Custom Metrics", "Smart Alerts"],
  },
  {
    title: "Team Collaboration",
    description:
      "Built-in collaboration tools with role-based access control, team workspaces, and project management.",
    icon: Users,
    color: "bg-orange-500",
    features: ["Role Management", "Team Workspaces", "Project Tracking"],
  },
  {
    title: "Integration Hub",
    description: "Seamlessly connect with popular tools and services through our extensive integration marketplace.",
    icon: Wrench,
    color: "bg-cyan-500",
    features: ["200+ Integrations", "Custom Webhooks", "API Gateway"],
  },
  {
    title: "Enterprise Ready",
    description: "Enterprise-grade features including SSO, compliance certifications, and dedicated support.",
    icon: Book,
    color: "bg-indigo-500",
    features: ["SSO Integration", "SOC 2 Compliant", "24/7 Support"],
  },
]

const seeAlsoLinks = [
  { title: "Getting Started", href: "/docs/getting-started" },
  { title: "API Reference", href: "/docs/api" },
  { title: "Changelog", href: "/docs/changelog" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Announcement Bar - Shows only on homepage and hides on scroll */}
      <Banner />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 pt-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GRA Core Platform Documentation
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Comprehensive documentation and guides to help you master GRA Core Platform with our enterprise-grade tools
            and workflows.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {featureCards.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {feature.description}
                  </CardDescription>
                  <div className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Start Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-16 border border-blue-100 dark:border-blue-800">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Need help getting started?</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Jump right into our comprehensive quick start guide
            </p>
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
        <div className="border-t border-slate-200 dark:border-slate-700 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">See Also</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {seeAlsoLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <div className="group p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {link.title}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600 dark:text-slate-400">
            <p>&copy; 2025 GRA Core Platform. Built with Next.js&nbsp;and&nbsp;MDX.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
