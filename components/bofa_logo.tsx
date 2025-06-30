import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function Logo() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = theme === "dark"
  const logoSrc = isDark ? "/BAC-white.png" : "/BAC.png"

  return (
    <div className="px-4 transform scale-150 transition-transform duration-300">
      <div className="w-15 h-10 rounded-lg overflow-hidden">
        <img
          key={logoSrc}
          src={logoSrc}
          alt="BAC Logo"
          className="w-full h-full object-cover transition-opacity duration-500 ease-in-out opacity-100"
        />
      </div>
    </div>
  )
}
