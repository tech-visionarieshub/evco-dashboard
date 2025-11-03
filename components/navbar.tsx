"use client"

import Link from "next/link"
import Image from "next/image"
import { BarChart3, Calendar, FileUp, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-white px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-4 md:gap-6 w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/evco-logo-horizontal.png"
            alt="EVCO Logo"
            width={120}
            height={40}
            className="h-auto w-auto"
          />
        </Link>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-200 hidden md:block" />

        {/* Navegación principal */}
        <nav className="hidden md:flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/upload" className="flex items-center gap-1">
              <FileUp className="h-4 w-4" />
              <span>Subir Forecast</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/analysis" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>Análisis</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Reportes</span>
            </Link>
          </Button>
        </nav>

        {/* Botón de acción principal */}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" asChild className="hidden md:flex">
            <Link href="/upload">
              <FileUp className="mr-2 h-4 w-4" />
              Subir Forecast
            </Link>
          </Button>
        </div>

        {/* Menú móvil */}
        <div className="md:hidden ml-auto">
          <Button variant="outline" size="sm" asChild>
            <Link href="/upload">
              <FileUp className="mr-2 h-4 w-4" />
              Subir Forecast
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
