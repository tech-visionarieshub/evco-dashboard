import { redirect } from "next/navigation"

export default function DashboardIndex() {
  // Redirige /dashboard a /dashboard/evco
  redirect("/dashboard/evco")
}
