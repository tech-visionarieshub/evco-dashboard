"use client"

import Link from "next/link"
import Image from "next/image"
import { BarChart3, FileUp, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-white px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-4 md:gap-6 w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/evco-logo-horizontal.png"
            alt="EVCO Logo"
            width={100}
            height={32}
            className="h-8 w-auto"
          />
        </Link>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-200 hidden md:block" />

        {/* Navegación principal */}
        <nav className="flex items-center gap-1 md:gap-4">
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
            <Link href="/ordenes-de-compra" className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span>Órdenes de Compra</span>
            </Link>
          </Button>
        </nav>

        {/* Espacio flexible */}
        <div className="flex-1"></div>
      </div>
    </header>
  )
}
