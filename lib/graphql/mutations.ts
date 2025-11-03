import { gql } from "@apollo/client"

export const CREATE_ORDEN_COMPRA = gql`
  mutation CreateOrdenCompra($input: OrdenCompraInput!) {
    createOrdenCompra(input: $input) {
      id
      numeroOrden
      cliente
      fechaOrden
      fechaRequerimiento
      direccionEnvio
      moneda
      lineas {
        id
        skuCliente
        skuEvco
        descripcion
        cantidad
        precio
        unidad
      }
      createdAt
      updatedAt
    }
  }
`
