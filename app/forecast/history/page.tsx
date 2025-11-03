import { redirect } from "next/navigation"

export default function HistoryRedirect() {
  redirect("/upload?tab=history")
  return null
}
