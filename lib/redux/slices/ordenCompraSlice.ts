import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface LineaOrden {
  id?: string
  skuCliente: string
  skuEvco: string
  descripcion: string
  cantidad: number
  precio: number
  unidad: string
}

interface OrdenCompra {
  id?: string
  numeroOrden: string
  cliente: string
  fechaOrden: string
  fechaRequerimiento: string
  direccionEnvio: string
  moneda: string
  lineas: LineaOrden[]
  createdAt?: string
  updatedAt?: string
}

interface OrdenCompraState {
  currentOrden: OrdenCompra | null
  ordenes: OrdenCompra[]
  loading: boolean
  error: string | null
}

const initialState: OrdenCompraState = {
  currentOrden: null,
  ordenes: [],
  loading: false,
  error: null,
}

const ordenCompraSlice = createSlice({
  name: "ordenCompra",
  initialState,
  reducers: {
    setOrdenCompra: (state, action: PayloadAction<OrdenCompra>) => {
      state.currentOrden = action.payload
    },
    addOrdenCompra: (state, action: PayloadAction<OrdenCompra>) => {
      state.ordenes.push(action.payload)
    },
    updateOrdenCompra: (state, action: PayloadAction<OrdenCompra>) => {
      const index = state.ordenes.findIndex((orden) => orden.id === action.payload.id)
      if (index !== -1) {
        state.ordenes[index] = action.payload
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setOrdenCompra, addOrdenCompra, updateOrdenCompra, setLoading, setError } = ordenCompraSlice.actions
export default ordenCompraSlice.reducer
