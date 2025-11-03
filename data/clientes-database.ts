"use client"

import { getFirestore, collection, getDocs } from "firebase/firestore"
import { app } from "@/lib/firebase/client"

const db = getFirestore(app)

// This array will hold the live client data from Firebase
let _clientesDatabase: Array<{ custId: string; name: string }> = []

// Function to fetch clients from Firebase and update the in-memory array
async function fetchClientsFromFirebase() {
  try {
    const clientesCol = collection(db, "clientes")
    const clienteSnapshot = await getDocs(clientesCol)
    const firebaseClients = clienteSnapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          custId: data.custid || data.custId || "",
          name: data.nombre || data.name || "",
        }
      })
      .filter((client) => client.custId && client.name) // Only include clients with both custId and name

    _clientesDatabase = firebaseClients
    console.log("Clientes cargados desde Firebase:", _clientesDatabase.length)
  } catch (error) {
    console.error("Error al cargar clientes desde Firebase:", error)
    // Fallback to empty array if Firebase fails
    _clientesDatabase = []
  }
}

// Immediately try to fetch clients from Firebase (non-blocking)
fetchClientsFromFirebase()

// Export the clients array with safe filtering
export const clientesDatabase = _clientesDatabase

// Function to search for a client by custId or partial name
export function buscarClientePorCustId(custIdOrName: string): string {
  if (!custIdOrName || !_clientesDatabase.length) return ""

  const searchLower = custIdOrName.toLowerCase().trim()

  // Try to parse "CUSTID - Name" format
  const match = searchLower.match(/^(\w+)\s*-\s*(.*)$/)
  let searchCustId = searchLower
  let searchName = searchLower

  if (match) {
    searchCustId = match[1]
    searchName = match[2]
  }

  const found = _clientesDatabase.find((cliente) => {
    if (!cliente.custId || !cliente.name) return false
    return cliente.custId.toLowerCase() === searchCustId || cliente.name.toLowerCase().includes(searchName)
  })

  return found ? found.name : ""
}

// Export a function to get fresh data
export function getClientesDatabase() {
  return _clientesDatabase
}

// Export a function to refresh data from Firebase
export async function refreshClientesDatabase() {
  await fetchClientsFromFirebase()
  return _clientesDatabase
}
