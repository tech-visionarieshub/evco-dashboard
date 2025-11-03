"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

export function DemandDashboard() {
  // Mock data - en Fase 2 se conectará con Firebase
  const dashboardData = {
    quickActions: [
      {
        title: "Nuevo Análisis",
        description: "Subir datos y generar pronóstico",
        icon: TrendingUp,
        href: "/demand/upload",
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        title: "Ver Historial",
        description: "Explorar análisis anteriores",
        icon: Calendar,
        href: "/demand/history",
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        title: "Comparar Períodos",
        description: "Análisis comparativo",
        icon: BarChart3,
        href: "/demand/compare",
        color: "bg-purple-600 hover:bg-purple-700",
      },
    ],
    systemStatus: {
      aiService: "active",
      firebaseConnection: "active",
      lastSync: "2024-01-15T10:30:00Z",
      dataQuality: 98.5,
    },
    recentActivity: [
      {
        type: "analysis_completed",
        message: "Análisis de demanda completado para 1,247 partes",
        timestamp: "2024-01-15T10:30:00Z",
        status: "success",
      },
      {
        type: "alert_generated",
        message: "12 alertas críticas detectadas por IA",
        timestamp: "2024-01-15T10:25:00Z",
        status: "warning",
      },
      {
        type: "data_uploaded",
        message: "Archivo de facturas procesado: 15,680 registros",
        timestamp: "2024-01-15T10:15:00Z",
        status: "info",
      },
    ],
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "info":
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />
    }
  }
}
