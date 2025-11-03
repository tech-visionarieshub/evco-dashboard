"use client"

import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import type { OrdenCompraFormData } from "@/lib/types/orden-compra"
import { clients } from "@/lib/constants"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface FormularioOrdenCompraProps {
  onChange: (data: Partial<OrdenCompraFormData>, isValid: boolean) => void
}

export function FormularioOrdenCompra({ onChange }: FormularioOrdenCompraProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<OrdenCompraFormData>({
    mode: "onChange",
    defaultValues: {
      customerId: "",
      poNumber: "",
      fechaOrden: "",
      fechaRequerida: "",
      canalRecepcion: "Correo",
    },
  })

  const watchAllFields = watch()
  const prevFormStateRef = useRef<string>("")

  useEffect(() => {
    // Notificar al componente padre sobre cambios en el formulario
    // Usamos JSON.stringify para evitar comparaciones de objetos que siempre son diferentes
    const currentFormState = JSON.stringify(watchAllFields)

    // Usamos una referencia para almacenar el estado anterior
    if (prevFormStateRef.current !== currentFormState) {
      prevFormStateRef.current = currentFormState
      onChange(watchAllFields, isValid)
    }
  }, [watchAllFields, isValid, onChange])

  // Direcciones de envío de ejemplo
  const shipToOptions = [
    "EVCO Plastics - DeForest, WI",
    "EVCO Plastics - Oshkosh, WI",
    "EVCO Plastics - Calhoun, GA",
    "Cliente directo - México",
    "Cliente directo - EE.UU.",
  ]

  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customerId" className="font-medium">
          Cliente <span className="text-red-500">*</span>
        </Label>
        <Select onValueChange={(value) => setValue("customerId", value, { shouldValidate: true })}>
          <SelectTrigger id="customerId" className={errors.customerId ? "border-red-500" : ""}>
            <SelectValue placeholder="Selecciona un cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client} value={client}>
                {client}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customerId && <p className="text-sm text-red-500">Este campo es obligatorio</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="poNumber" className="font-medium">
          Número de PO <span className="text-red-500">*</span>
        </Label>
        <Input
          id="poNumber"
          {...register("poNumber", { required: true })}
          className={errors.poNumber ? "border-red-500" : ""}
        />
        {errors.poNumber && <p className="text-sm text-red-500">Este campo es obligatorio</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fechaOrden" className="font-medium">
          Fecha de Orden <span className="text-red-500">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !watchAllFields.fechaOrden && "text-muted-foreground",
                errors.fechaOrden && "border-red-500",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {watchAllFields.fechaOrden ? (
                format(new Date(watchAllFields.fechaOrden), "PPP", { locale: es })
              ) : (
                <span>Selecciona una fecha</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={watchAllFields.fechaOrden ? new Date(watchAllFields.fechaOrden) : undefined}
              onSelect={(date) => {
                if (date) {
                  setValue("fechaOrden", date.toISOString(), { shouldValidate: true })
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.fechaOrden && <p className="text-sm text-red-500">Este campo es obligatorio</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fechaRequerida" className="font-medium">
          Fecha Requerida del Material <span className="text-red-500">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !watchAllFields.fechaRequerida && "text-muted-foreground",
                errors.fechaRequerida && "border-red-500",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {watchAllFields.fechaRequerida ? (
                format(new Date(watchAllFields.fechaRequerida), "PPP", { locale: es })
              ) : (
                <span>Selecciona una fecha</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={watchAllFields.fechaRequerida ? new Date(watchAllFields.fechaRequerida) : undefined}
              onSelect={(date) => {
                if (date) {
                  setValue("fechaRequerida", date.toISOString(), { shouldValidate: true })
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.fechaRequerida && <p className="text-sm text-red-500">Este campo es obligatorio</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fechaRequerimiento" className="font-medium">
          Fecha de Requerimiento
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !watchAllFields.fechaRequerimiento && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {watchAllFields.fechaRequerimiento ? (
                format(new Date(watchAllFields.fechaRequerimiento), "PPP", { locale: es })
              ) : (
                <span>Selecciona una fecha</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={watchAllFields.fechaRequerimiento ? new Date(watchAllFields.fechaRequerimiento) : undefined}
              onSelect={(date) => {
                if (date) {
                  setValue("fechaRequerimiento", date.toISOString(), { shouldValidate: true })
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billTo" className="font-medium">
          Bill To (Dirección de Facturación)
        </Label>
        <Textarea
          id="billTo"
          {...register("billTo")}
          placeholder="Ingresa la dirección de facturación (opcional)"
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="canalRecepcion" className="font-medium">
          Canal de Recepción <span className="text-red-500">*</span>
        </Label>
        <Select
          defaultValue="Correo"
          onValueChange={(value) => setValue("canalRecepcion", value as any, { shouldValidate: true })}
        >
          <SelectTrigger id="canalRecepcion">
            <SelectValue placeholder="Selecciona un canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Correo">Correo</SelectItem>
            <SelectItem value="Portal">Portal</SelectItem>
            <SelectItem value="EDI">EDI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="direccionCliente" className="font-medium">
            Dirección del Cliente
          </Label>
          <Textarea
            id="direccionCliente"
            {...register("direccionCliente")}
            placeholder="Ingresa la dirección del cliente"
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shipTo" className="font-medium">
            Ship To (Dirección de Envío)
          </Label>
          <Select onValueChange={(value) => setValue("shipTo", value)}>
            <SelectTrigger id="shipTo">
              <SelectValue placeholder="Selecciona una dirección de envío" />
            </SelectTrigger>
            <SelectContent>
              {shipToOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoOrden" className="font-medium">
          Tipo de Orden
        </Label>
        <Select onValueChange={(value) => setValue("tipoOrden", value as any)}>
          <SelectTrigger id="tipoOrden">
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Nacional">Nacional</SelectItem>
            <SelectItem value="Exportación">Exportación</SelectItem>
            <SelectItem value="Express">Express</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones" className="font-medium">
          Observaciones
        </Label>
        <Textarea
          id="observaciones"
          {...register("observaciones")}
          placeholder="Ingresa cualquier observación relevante"
          className="min-h-[100px]"
        />
      </div>
    </form>
  )
}
