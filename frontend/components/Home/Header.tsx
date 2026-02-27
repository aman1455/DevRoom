"use client"

import { Search, Heart, Menu, X, Star, Github, FileText, Zap, Home } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ModeToggle } from "../ui/mode-toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Handle body scroll when sidebar is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

	return (
		<header className='sticky top-0 z-50 w-full bg-background border-b-4 border-primary px-6 py-4'>
			<div className='max-w-7xl mx-auto flex items-center justify-between'>
				{/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 group"
        >
          <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center group-hover:bg-purple-400">
            <span className="text-background font-bold text-sm">D</span>
          </div>
          <span className="font-bold text-2xl tracking-tight text-primary group-hover:text-purple-400">
            DevRoom
          </span>
        </Link>


        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/docs"
            className="font-semibold text-primary c transition-colors  hover:text-purple-400"
          >
            Docs
          </Link>
          <a
            href="https://github.com/aman1455/DevRoom"
            className="font-semibold text-primary hover:text-purple-400 transition-colors"
          >
            GitHub
          </a>

          <Link
            href="/features"
            className="font-semibold text-foreground hover:text-purple-400 transition-colors"
          >
            Features
          </Link>
        </nav>

        {/* Icons */}
        <div className="hidden md:flex items-center space-x-4">
          
          <div>
            <ModeToggle />
          </div>
          <button className="p-2 hover:bg-muted rounded-sm transition-colors">
            <Search className="w-5 h-5 text-primary" />
          </button>
          <button className="p-2 hover:bg-muted rounded-sm transition-colors">
            <Heart className="w-5 h-5 text-primary" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 border-2 border-foreground rounded-sm hover:bg-muted transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="w-5 h-5 text-foreground" />
          ) : (
            <Menu className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-80 max-w-[80vw] z-50 md:hidden
        bg-background border-l-4 border-foreground shadow-[0_0_0_4px_rgba(0,0,0,0.3)]
        transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-foreground">
          <h2 className="text-xl font-bold text-foreground">Menu</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 border-2 border-foreground rounded-sm hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="p-6 space-y-6">
          {/* Navigation Links */}
          <nav className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Navigation
            </h3>
            
            <Link
              href="/"
              className="flex items-center space-x-3 p-3 border-2 border-foreground rounded-sm hover:bg-muted transition-colors group"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-5 h-5 text-foreground group-hover:text-purple-400 transition-colors" />
              <span className="font-semibold text-foreground group-hover:text-purple-400 transition-colors">
                Home
              </span>
            </Link>

            <Link
              href="/features"
              className="flex items-center space-x-3 p-3 border-2 border-foreground rounded-sm hover:bg-muted transition-colors group"
              onClick={() => setIsMenuOpen(false)}
            >
              <Zap className="w-5 h-5 text-foreground group-hover:text-purple-400 transition-colors" />
              <span className="font-semibold text-foreground group-hover:text-purple-400 transition-colors">
                Features
              </span>
            </Link>

            <a
              href="/docs"
              className="flex items-center space-x-3 p-3 border-2 border-foreground rounded-sm hover:bg-muted transition-colors group"
              onClick={() => setIsMenuOpen(false)}
            >
              <FileText className="w-5 h-5 text-foreground group-hover:text-purple-400 transition-colors" />
              <span className="font-semibold text-foreground group-hover:text-purple-400 transition-colors">
                Documentation
              </span>
            </a>

           
          </nav>

          {/* Theme & Tools Section */}
          <div className="space-y-4 pt-6 border-t-2 border-foreground">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Tools
            </h3>
            
            <div className="flex items-center justify-between p-3 border-2 border-foreground rounded-sm">
              <span className="font-semibold text-foreground">Theme</span>
              <ModeToggle />
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 p-3 border-2 border-foreground rounded-sm hover:bg-muted transition-colors group">
                <Search className="w-5 h-5 text-foreground group-hover:text-purple-400 transition-colors mx-auto" />
              </button>
              <button className="flex-1 p-3 border-2 border-foreground rounded-sm hover:bg-muted transition-colors group">
                <Heart className="w-5 h-5 text-foreground group-hover:text-purple-400 transition-colors mx-auto" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              DevRoom v1.0
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Built with Next.js & TypeScript
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
