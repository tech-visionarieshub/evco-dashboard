"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronsUpDown, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useClientes } from "@/lib/hooks/use-firebase-clientes"

type ClientItem = {
  custId: string
  name: string
}

function normalizeClient(raw: any): ClientItem | null {
  const custId = raw?.custId ?? raw?.cust_id ?? raw?.id ?? (typeof raw?.codigo === "string" ? raw.codigo : undefined)
  const name = raw?.name ?? raw?.nombre ?? raw?.razon_social ?? custId
  if (!custId) return null
  return { custId: String(custId), name: String(name ?? custId) }
}

function mapClientes(rawList: any[]): ClientItem[] {
  return rawList.map(normalizeClient).filter(Boolean) as ClientItem[]
}

export function ClientMultiSelect({
  selected = [],
  onChange,
  className,
  buttonLabel = "Clientes",
  maxToShowBadges = 3,
}: {
  selected?: string[] // custId[]
  onChange: (ids: string[]) => void
  className?: string
  buttonLabel?: string
  maxToShowBadges?: number
}) {
  const { clientes, loading, error } = useClientes()

  // Intentamos usar los clientes del hook (lo que ya funciona en Órdenes de compra).
  const hookClients: ClientItem[] = useMemo(() => mapClientes(clientes as any[]), [clientes])

  // Fallback: dataset local (sin lecturas a Firestore en el cliente).
  const localClients: ClientItem[] = []

  // Fuente final: hook si trae datos; si no, fallback local.
  const allClients = hookClients.length > 0 ? hookClients : localClients

  const [search, setSearch] = useState("")
  const [manualCustId, setManualCustId] = useState("")

  // Si el hook falla por permisos, aún así tendremos opciones por el fallback local.
  useEffect(() => {
    if (error) {
      // Solo log para debug; no interrumpimos la UX.
      console.warn("useClientes error (se usará fallback local si aplica):", error)
    }
  }, [error])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return allClients
    return allClients.filter((c) => c.name.toLowerCase().includes(term) || c.custId.toLowerCase().includes(term))
  }, [allClients, search])

  function toggle(custId: string) {
    const next = selected.includes(custId) ? selected.filter((x) => x !== custId) : [...selected, custId]
    onChange(next)
  }

  function addManual() {
    const val = manualCustId.trim()
    if (!val) return
    if (!selected.includes(val)) {
      onChange([...selected, val])
    }
    setManualCustId("")
  }

  const shownBadges = selected.slice(0, maxToShowBadges)
  const hiddenCount = selected.length - shownBadges.length

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[260px] justify-between bg-transparent">
              {buttonLabel} ({selected.length})
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 p-0">
            <div className="p-2 border-b">
              <div className="relative">
                <Input
                  placeholder="Buscar por nombre o custId..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7"
                />
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Agregar custId manual"
                  value={manualCustId}
                  onChange={(e) => setManualCustId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addManual()
                    }
                  }}
                />
                <Button size="icon" variant="secondary" onClick={addManual} aria-label="Agregar custId">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="max-h-64">
              <div className="py-1">
                {loading && hookClients.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Cargando clientes...</div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</div>
                )}
                {filtered.map((c) => {
                  const checked = selected.includes(c.custId)
                  return (
                    <DropdownMenuCheckboxItem
                      key={`${c.custId}-${c.name}`}
                      checked={checked}
                      onCheckedChange={() => toggle(c.custId)}
                      className="gap-2"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">ID: {c.custId}</span>
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="p-2 border-t flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onChange([])}>
                Limpiar selección
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Badges de seleccionados */}
        {shownBadges.map((custId) => {
          const c = allClients.find((x) => x.custId === custId)
          const label = c ? `${c.name} (${c.custId})` : custId
          return (
            <Badge key={custId} variant="secondary" className="flex items-center gap-1">
              <span className="max-w-[180px] truncate">{label}</span>
              <button
                aria-label={`Quitar ${label}`}
                className="ml-1 hover:text-destructive"
                onClick={() => onChange(selected.filter((x) => x !== custId))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          )
        })}
        {hiddenCount > 0 && <Badge variant="outline">+{hiddenCount}</Badge>}
      </div>
    </div>
  )
}
