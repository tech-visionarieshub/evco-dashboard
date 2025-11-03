// Historiales de forecast para uso durante el MVP
// Estos datos se eliminarán después de la fase MVP cuando se implemente la conexión real a la base de datos

export type ForecastHistoryItem = {
  custId?: string // Opcional para compatibilidad con diferentes formatos
  vendorId?: string // Opcional para compatibilidad con diferentes formatos
  partNumber: string
  partClient?: string // Campo opcional para el número de parte del cliente
  productId?: string // Campo opcional para el ID del producto
  description?: string // Campo opcional para la descripción
  months: {
    [key: string]: number
  }
}

export type ForecastHistory = {
  week: number
  year: number
  title: string
  lastUpdated: string
  items: ForecastHistoryItem[]
}

// Función auxiliar para convertir valores de string a número, manejando formatos con comas
const parseNumberValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0
  if (typeof value === "number") return value
  // Eliminar comas y convertir a número
  return Number.parseFloat(value.replace(/,/g, ""))
}

// Historial de forecast para la Semana 20
export const forecastHistoryWeek20: ForecastHistory = {
  week: 20,
  year: 2025,
  title: "FORECAST MARELLI SISTEMAS 2025",
  lastUpdated: "2025-05-15T10:00:00Z",
  items: [
    {
      custId: "20149",
      partNumber: "957104",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 0,
        "Dec-25": 0,
        "Jan-26": 0,
        "Feb-26": 0,
        "Mar-26": 0,
        "Apr-26": 0,
        "May-26": 0,
        "Jun-26": 0,
        "Jul-26": 0,
        "Aug-26": 0,
        "Sep-26": 0,
        "Oct-26": 0,
        "Nov-26": 0,
        "Dec-26": 0,
        "Jan-27": 0,
        "Feb-27": 0,
        "Mar-27": 0,
        "Apr-27": 0,
        "May-27": 0,
      },
    },
    {
      custId: "20149",
      partNumber: "957105",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 0,
        "Dec-25": 0,
        "Jan-26": 0,
        "Feb-26": 0,
        "Mar-26": 0,
        "Apr-26": 0,
        "May-26": 0,
        "Jun-26": 0,
        "Jul-26": 0,
        "Aug-26": 0,
        "Sep-26": 0,
        "Oct-26": 0,
        "Nov-26": 0,
        "Dec-26": 0,
        "Jan-27": 0,
        "Feb-27": 0,
        "Mar-27": 0,
        "Apr-27": 0,
        "May-27": 0,
      },
    },
    {
      custId: "20149",
      partNumber: "957106",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 0,
        "Dec-25": 0,
        "Jan-26": 0,
        "Feb-26": 0,
        "Mar-26": 0,
        "Apr-26": 0,
        "May-26": 0,
        "Jun-26": 0,
        "Jul-26": 0,
        "Aug-26": 0,
        "Sep-26": 0,
        "Oct-26": 0,
        "Nov-26": 0,
        "Dec-26": 0,
        "Jan-27": 0,
        "Feb-27": 0,
        "Mar-27": 0,
        "Apr-27": 0,
        "May-27": 0,
      },
    },
    {
      custId: "20149",
      partNumber: "957107",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 0,
        "Dec-25": 0,
        "Jan-26": 0,
        "Feb-26": 0,
        "Mar-26": 0,
        "Apr-26": 0,
        "May-26": 0,
        "Jun-26": 0,
        "Jul-26": 0,
        "Aug-26": 0,
        "Sep-26": 0,
        "Oct-26": 0,
        "Nov-26": 0,
        "Dec-26": 0,
        "Jan-27": 0,
        "Feb-27": 0,
        "Mar-27": 0,
        "Apr-27": 0,
        "May-27": 0,
      },
    },
    {
      custId: "20149",
      partNumber: "957108",
      months: {
        "May-25": parseNumberValue("30,000"),
        "Jun-25": parseNumberValue("88,000"),
        "Jul-25": parseNumberValue("100,000"),
        "Aug-25": parseNumberValue("130,000"),
        "Sep-25": parseNumberValue("124,000"),
        "Oct-25": parseNumberValue("118,000"),
        "Nov-25": parseNumberValue("94,000"),
        "Dec-25": parseNumberValue("134,000"),
        "Jan-26": parseNumberValue("156,000"),
        "Feb-26": parseNumberValue("68,000"),
        "Mar-26": parseNumberValue("28,000"),
        "Apr-26": parseNumberValue("28,000"),
        "May-26": parseNumberValue("88,000"),
        "Jun-26": parseNumberValue("88,000"),
        "Jul-26": parseNumberValue("82,000"),
        "Aug-26": parseNumberValue("82,000"),
        "Sep-26": parseNumberValue("52,666"),
        "Oct-26": parseNumberValue("52,666"),
        "Nov-26": parseNumberValue("52,666"),
        "Dec-26": parseNumberValue("46,000"),
        "Jan-27": parseNumberValue("46,000"),
        "Feb-27": parseNumberValue("46,000"),
        "Mar-27": parseNumberValue("7,333"),
        "Apr-27": parseNumberValue("7333"),
        "May-27": parseNumberValue("7,333"),
      },
    },
    {
      custId: "20149",
      partNumber: "957109",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": parseNumberValue("8,000"),
        "Sep-25": parseNumberValue("10,000"),
        "Oct-25": parseNumberValue("12,000"),
        "Nov-25": parseNumberValue("12,000"),
        "Dec-25": 0,
        "Jan-26": 0,
        "Feb-26": 0,
        "Mar-26": 0,
        "Apr-26": 0,
        "May-26": parseNumberValue("1,000"),
        "Jun-26": parseNumberValue("1,000"),
        "Jul-26": parseNumberValue("7,000"),
        "Aug-26": parseNumberValue("7,000"),
        "Sep-26": parseNumberValue("10,000"),
        "Oct-26": parseNumberValue("10,000"),
        "Nov-26": parseNumberValue("10,000"),
        "Dec-26": parseNumberValue("9,333"),
        "Jan-27": parseNumberValue("9,333"),
        "Feb-27": parseNumberValue("9,333"),
        "Mar-27": parseNumberValue("3,333"),
        "Apr-27": parseNumberValue("3333"),
        "May-27": parseNumberValue("3333"),
      },
    },
  ],
}

// Historial de forecast para Sistemas Velvac 2025
export const forecastHistoryVelvac: ForecastHistory = {
  week: 21,
  year: 2025,
  title: "FORECAST SISTEMAS VELVAC 2025",
  lastUpdated: "2025-05-15T14:30:00Z",
  items: [
    {
      custId: "30011",
      partNumber: "960571",
      partClient: "CAP FOR PIVOT ELBOW 7095470",
      months: {
        "May-25": 0,
        "Jun-25": 6272,
        "Jul-25": 6272,
        "Aug-25": 6272,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960572",
      partClient: "BALL JOINT CAP 7094560",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 10000,
        "Aug-25": 0,
        "Sep-25": 599,
      },
    },
    {
      custId: "30011",
      partNumber: "960573",
      partClient: "BALL JOINT SWIVEL 7094550",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 10000,
        "Aug-25": 0,
        "Sep-25": 1573,
      },
    },
    {
      custId: "30011",
      partNumber: "960579",
      partClient: "7108100 UPR ARM-38N AUX, RH, BLK, TX, GFN",
      months: {
        "May-25": 0,
        "Jun-25": 5000,
        "Jul-25": 6651,
        "Aug-25": 7303,
        "Sep-25": 6923,
      },
    },
    {
      custId: "30011",
      partNumber: "960580",
      partClient: "7108110 UPR ARM-38N AUX, LH, BLK, TX, GFN",
      months: {
        "May-25": 0,
        "Jun-25": 5000,
        "Jul-25": 6140,
        "Aug-25": 5173,
        "Sep-25": 6039,
      },
    },
    {
      custId: "30011",
      partNumber: "960581",
      partClient: "7108280 LWR ARM-38N AUX, RH, BLK, TX, GFN",
      months: {
        "May-25": 0,
        "Jun-25": 5000,
        "Jul-25": 7303,
        "Aug-25": 9625,
        "Sep-25": 6923,
      },
    },
    {
      custId: "30011",
      partNumber: "960582",
      partClient: "7108290 LWR ARM-38N AUX, LH, BLK, TX, GFN",
      months: {
        "May-25": 0,
        "Jun-25": 5000,
        "Jul-25": 6140,
        "Aug-25": 5173,
        "Sep-25": 6039,
      },
    },
    {
      custId: "30011",
      partNumber: "960583",
      partClient: "7108080 HOOD BRKT 38N AUX RH",
      months: {
        "May-25": 0,
        "Jun-25": 5000,
        "Jul-25": 2452,
        "Aug-25": 3328,
        "Sep-25": 3177,
      },
    },
    {
      custId: "30011",
      partNumber: "960584",
      partClient: "7108090 HOOD BRKT 38N AUX LH",
      months: {
        "May-25": 0,
        "Jun-25": 5000,
        "Jul-25": 2239,
        "Aug-25": 3202,
        "Sep-25": 2533,
      },
    },
    {
      custId: "30011",
      partNumber: "960585",
      partClient: "NV7112050 SHELL AERO PV LH",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 57,
      },
    },
    {
      custId: "30011",
      partNumber: "960586",
      partClient: "NV7112060 SHELL AERO PV RH",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960587",
      partClient: "7114160 Bezel, Molded NGT",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 1000,
        "Aug-25": 1000,
        "Sep-25": 1000,
      },
    },
    {
      custId: "30011",
      partNumber: "960592",
      partClient: "NV7112420 BEZEL, DSVM, RH, KENWORTH",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960593",
      partClient: "NV7112430 BEZEL, DSVM, LH, KENWORTH",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960598",
      partClient: "7112260 ARM FRONT RH HOOD MOUNT PB MLU",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960599",
      partClient: "7112270 ARM FRONT LH HOOD MOUNT PB MLU",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960600",
      partClient: "7112050 - SHELL AERO PV LH",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960601",
      partClient: "7112060 - SHELL AERO PV RH",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960602",
      partClient: "7114170 Plate Flat Glass NGT",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 1008,
        "Aug-25": 1008,
        "Sep-25": 925,
      },
    },
    {
      custId: "30011",
      partNumber: "960603",
      partClient: "7114140 Housing NGT",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 2016,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960604",
      partClient: "7115180",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960605",
      partClient: "7115190",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
      },
    },
    {
      custId: "30011",
      partNumber: "960606",
      partClient: "7114460 BRACKET LOOKDOWN MIRROR",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 1763,
        "Aug-25": 1560,
        "Sep-25": 2060,
      },
    },
    {
      custId: "30011",
      partNumber: "960607",
      partClient: "7115330 GLASS HOUSING, SUBASSEMBLY, LOOKDOWN MIRROR",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 1763,
        "Aug-25": 1560,
        "Sep-25": 2060,
      },
    },
  ],
}

// Historial de forecast para YETI 2025
export const forecastHistoryYeti: ForecastHistory = {
  week: 22,
  year: 2025,
  title: "FORECAST YETI 120525",
  lastUpdated: "2025-05-12T09:00:00Z",
  items: [
    {
      vendorId: "30081",
      partNumber: "968094",
      productId: "10033440016 - Roadie 15 Alpine Yellow",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 44,
        "Sep-25": 2630,
        "Oct-25": 2652,
        "Nov-25": 244,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968095",
      productId: "70000005827 - INTL Roadie 15 APY",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 28,
        "Sep-25": 0,
        "Oct-25": 26,
        "Nov-25": 39,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968102",
      productId: "10033440017 - Roadie 15 Aquifer Blue",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 36,
        "Sep-25": 2780,
        "Oct-25": 2222,
        "Nov-25": 177,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968103",
      productId: "70000005828 - INTL Roadie 15 ABL",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 28,
        "Sep-25": 0,
        "Oct-25": 26,
        "Nov-25": 39,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968098",
      productId: "10033440018 - Roadie 15 Bimini Pink",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 84,
        "Sep-25": 1852,
        "Oct-25": 2836,
        "Nov-25": 336,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968099",
      productId: "70000005829 - INTL Roadie 15 BPK",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 24,
        "Sep-25": 0,
        "Oct-25": 20,
        "Nov-25": 30,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968106",
      productId: "10033440019 - Roadie 15 Black",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 24,
        "Sep-25": 992,
        "Oct-25": 426,
        "Nov-25": 381,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968107",
      productId: "70000005830 - INTL Roadie 15 BLK",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 32,
        "Sep-25": 0,
        "Oct-25": 28,
        "Nov-25": 42,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968104",
      productId: "10033440021 - Roadie 15 Cape Taupe",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 44,
        "Sep-25": 641,
        "Oct-25": 596,
        "Nov-25": 223,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968105",
      productId: "70000005832 - INTL Roadie 15 CPT",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 28,
        "Sep-25": 0,
        "Oct-25": 26,
        "Nov-25": 39,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968060",
      productId: "10033160000 - Roadie 15 Charcoal",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 131,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 821,
        "Dec-25": 1692,
        "Jan-26": 1503,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968065",
      productId: "70000002255 - INTL Roadie 15 CHR",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 153,
        "Dec-25": 104,
        "Jan-26": 145,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968092",
      productId: "10033440014 - Roadie 15 Cosmic Lilac",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 56,
        "Sep-25": 659,
        "Oct-25": 423,
        "Nov-25": 441,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968093",
      productId: "70000005825 - INTL Roadie 15 CLL",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 28,
        "Sep-25": 0,
        "Oct-25": 26,
        "Nov-25": 39,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968090",
      productId: "10033440015 - Roadie 15 Key Lime",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 36,
        "Sep-25": 399,
        "Oct-25": 240,
        "Nov-25": 312,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968091",
      productId: "70000005826 - INTL Roadie 15 KEY",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 24,
        "Sep-25": 0,
        "Oct-25": 26,
        "Nov-25": 39,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968050",
      productId: "10033200000 - Roadie 15 Navy",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 264,
        "Sep-25": 0,
        "Oct-25": 706,
        "Nov-25": 1115,
        "Dec-25": 1717,
        "Jan-26": 2177,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968064",
      productId: "70000002256 - INTL Roadie 15 NVY",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 43,
        "Nov-25": 137,
        "Dec-25": 91,
        "Jan-26": 114,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968061",
      productId: "10033350000 - Roadie 15 Rescue Red",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 93,
        "Sep-25": 0,
        "Oct-25": 692,
        "Nov-25": 999,
        "Dec-25": 1095,
        "Jan-26": 1159,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968066",
      productId: "70000002691 - INTL Roadie 15 RRD",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 98,
        "Dec-25": 60,
        "Jan-26": 87,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968084",
      productId: "10033010000 - Roadie 15 Tan",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 607,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 652,
        "Dec-25": 894,
        "Jan-26": 672,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968085",
      productId: "70000002253 - INTL Roadie 15 TAN",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 52,
        "Dec-25": 91,
        "Jan-26": 108,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968082",
      productId: "10033020000 - Roadie 15 White",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 72,
        "Sep-25": 0,
        "Oct-25": 77,
        "Nov-25": 992,
        "Dec-25": 790,
        "Jan-26": 800,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968083",
      productId: "70000002254 - INTL Roadie 15 WHT",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 0,
        "Dec-25": 28,
        "Jan-26": 28,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968001",
      productId: "10023160000 - Roadie 60 Charcoal",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 2038,
        "Sep-25": 16,
        "Oct-25": 346,
        "Nov-25": 635,
        "Dec-25": 589,
        "Jan-26": 566,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968004",
      productId: "70000001023 - INTL Roadie 60 CHR",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 5,
        "Nov-25": 38,
        "Dec-25": 21,
        "Jan-26": 56,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968000",
      productId: "10023200000 - Roadie 60 Navy",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 875,
        "Sep-25": 12,
        "Oct-25": 268,
        "Nov-25": 452,
        "Dec-25": 315,
        "Jan-26": 377,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968003",
      productId: "70000001024 - INTL Roadie 60 NVY",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 21,
        "Sep-25": 0,
        "Oct-25": 14,
        "Nov-25": 23,
        "Dec-25": 17,
        "Jan-26": 90,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968040",
      productId: "10023390000 - Roadie 60 Rescue Red",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 600,
        "Sep-25": 3,
        "Oct-25": 86,
        "Nov-25": 164,
        "Dec-25": 196,
        "Jan-26": 178,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968018",
      productId: "70000001789 - INTL Roadie 60 RRD",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 25,
        "Sep-25": 0,
        "Oct-25": 16,
        "Nov-25": 25,
        "Dec-25": 12,
        "Jan-26": 35,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968002",
      productId: "10023020000 - Roadie 60 White",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 796,
        "Sep-25": 16,
        "Oct-25": 110,
        "Nov-25": 227,
        "Dec-25": 283,
        "Jan-26": 229,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968005",
      productId: "70000001022 - INTL Roadie 60 WHT",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 35,
        "Sep-25": 0,
        "Oct-25": 6,
        "Nov-25": 9,
        "Dec-25": 4,
        "Jan-26": 16,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968006",
      productId: "20020020020 - Roadie 48/60 Wheeled Cooler Divider",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 484,
        "Oct-25": 365,
        "Nov-25": 442,
        "Dec-25": 904,
        "Jan-26": 809,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968010",
      productId: "20020020021 - Roadie Cooler Cup Caddy",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 205,
        "Oct-25": 79,
        "Nov-25": 68,
        "Dec-25": 73,
        "Jan-26": 93,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968007",
      productId: "70000001027 - INTL Roadie 48/60 Wheeled Cooler Divider",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 31,
        "Oct-25": 25,
        "Nov-25": 39,
        "Dec-25": 88,
        "Jan-26": 179,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968011",
      productId: "70000001028 - INTL Roadie Cooler Cup Caddy",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 18,
        "Oct-25": 16,
        "Nov-25": 18,
        "Dec-25": 44,
        "Jan-26": 63,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968062",
      productId: "10033010000 - Roadie 15 Tan",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 0,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968067",
      productId: "70000002253 - INTL Roadie 15 TAN",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 0,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968063",
      productId: "10033020000 - Roadie 15 White",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 0,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
    {
      vendorId: "30081",
      partNumber: "968068",
      productId: "70000002254 - INTL Roadie 15 WHT",
      months: {
        "May-25": 0,
        "Jun-25": 0,
        "Jul-25": 0,
        "Aug-25": 0,
        "Sep-25": 0,
        "Oct-25": 0,
        "Nov-25": 0,
        "Dec-25": 0,
        "Jan-26": 0,
      },
    },
  ],
}

// Historial de forecast para DONALDSON 2025
export const forecastHistoryDonaldson: ForecastHistory = {
  week: 23,
  year: 2025,
  title: "ValidacionFcstDONALDSON",
  lastUpdated: "2025-05-15T16:45:00Z",
  items: [
    {
      custId: "10006",
      partNumber: "965313",
      description: "",
      months: {
        "jun-25": 291,
        "jul-25": 328,
        "ago-25": 168,
        "sep-25": 168,
        "oct-25": 168,
        "nov-25": 280,
        "dec-25": 56,
      },
    },
    {
      custId: "10006",
      partNumber: "965328",
      description: "",
      months: {
        "jun-25": 0,
        "jul-25": 250,
        "ago-25": 0,
        "sep-25": 0,
        "oct-25": 0,
        "nov-25": 0,
        "dec-25": 0,
      },
    },
    {
      custId: "10006",
      partNumber: "965327",
      description: "",
      months: {
        "jun-25": 0,
        "jul-25": 100,
        "ago-25": 0,
        "sep-25": 106,
        "oct-25": 0,
        "nov-25": 100,
        "dec-25": 0,
      },
    },
    {
      custId: "10006",
      partNumber: "965325",
      description: "",
      months: {
        "jun-25": 300,
        "jul-25": 0,
        "ago-25": 300,
        "sep-25": 0,
        "oct-25": 0,
        "nov-25": 0,
        "dec-25": 0,
      },
    },
    {
      custId: "10006",
      partNumber: "965339",
      description: "",
      months: {
        "jun-25": 0,
        "jul-25": 6000,
        "ago-25": 6000,
        "sep-25": 6000,
        "oct-25": 6000,
        "nov-25": 0,
        "dec-25": 0,
      },
    },
    {
      custId: "10006",
      partNumber: "965316",
      description: "",
      months: {
        "jun-25": 80,
        "jul-25": 0,
        "ago-25": 0,
        "sep-25": 0,
        "oct-25": 80,
        "nov-25": 0,
        "dec-25": 0,
      },
    },
    {
      custId: "10006",
      partNumber: "965337",
      description: "",
      months: {
        "jun-25": 800,
        "jul-25": 800,
        "ago-25": 0,
        "sep-25": 800,
        "oct-25": 0,
        "nov-25": 0,
        "dec-25": 800,
      },
    },
    {
      custId: "10006",
      partNumber: "965341",
      description: "",
      months: {
        "jun-25": 57600,
        "jul-25": 87600,
        "ago-25": 57600,
        "sep-25": 115200,
        "oct-25": 57600,
        "nov-25": 0,
        "dec-25": 0,
      },
    },
    {
      custId: "10006",
      partNumber: "965331",
      description: "",
      months: {
        "jun-25": 0,
        "jul-25": 1540,
        "ago-25": 0,
        "sep-25": 0,
        "oct-25": 0,
        "nov-25": 0,
        "dec-25": 0,
      },
    },
    {
      custId: "10006",
      partNumber: "965307",
      description: "",
      months: {
        "jun-25": 0,
        "jul-25": 1500,
        "ago-25": 750,
        "sep-25": 0,
        "oct-25": 0,
        "nov-25": 0,
        "dec-25": 0,
      },
    },
  ],
}

// Función para obtener todos los historiales de forecast disponibles
export const getAllForecastHistories = (): ForecastHistory[] => {
  return [forecastHistoryWeek20, forecastHistoryVelvac, forecastHistoryYeti, forecastHistoryDonaldson]
}

// Función para obtener un historial de forecast específico por semana y año
export const getForecastHistoryByWeek = (week: number, year: number): ForecastHistory | undefined => {
  return getAllForecastHistories().find((history) => history.week === week && history.year === year)
}

// Función para obtener un historial de forecast específico por título
export const getForecastHistoryByTitle = (title: string): ForecastHistory | undefined => {
  return getAllForecastHistories().find((history) => history.title === title)
}

// Función para obtener los meses disponibles en un historial de forecast
export const getAvailableMonths = (history: ForecastHistory): string[] => {
  if (history.items.length === 0) return []
  return Object.keys(history.items[0].months)
}

// Función para normalizar los nombres de los meses para mostrarlos de manera consistente
export const normalizeMonthName = (monthKey: string): string => {
  // Si el mes ya está en formato "Mmm-YY", devolverlo tal cual
  if (/^[A-Z][a-z]{2}-\d{2}$/.test(monthKey)) {
    return monthKey
  }

  // Convertir formatos como "jun-25" a "Jun-25"
  if (/^[a-z]{3}-\d{2}$/.test(monthKey)) {
    return monthKey.charAt(0).toUpperCase() + monthKey.slice(1)
  }

  // Convertir formatos como "ago-25" a "Aug-25"
  if (monthKey.startsWith("ago-")) {
    return "Aug" + monthKey.slice(3)
  }

  return monthKey
}

// Función para convertir el historial de forecast a formato de tabla
export const convertForecastHistoryToTableData = (history: ForecastHistory) => {
  const months = getAvailableMonths(history)
  const hasPartClient = history.items.some((item) => item.partClient)
  const hasProductId = history.items.some((item) => item.productId)
  const hasVendorId = history.items.some((item) => item.vendorId)
  const hasDescription = history.items.some((item) => item.description !== undefined)

  return history.items.map((item) => {
    const tableRow: any = {}

    if (hasVendorId) {
      tableRow.vendorId = item.vendorId || ""
    } else {
      tableRow.custId = item.custId || ""
    }

    tableRow.partNumber = item.partNumber

    if (hasPartClient) {
      tableRow.partClient = item.partClient || ""
    }

    if (hasProductId) {
      tableRow.productId = item.productId || ""
    }

    if (hasDescription) {
      tableRow.description = item.description || ""
    }

    // Añadir cada mes como una columna
    months.forEach((month) => {
      tableRow[month] = item.months[month]
    })

    return tableRow
  })
}

// Función para calcular totales por mes
export const calculateMonthlyTotals = (history: ForecastHistory) => {
  const months = getAvailableMonths(history)
  const totals: { [key: string]: number } = {}

  // Inicializar totales en 0
  months.forEach((month) => {
    totals[month] = 0
  })

  // Sumar los valores de cada mes
  history.items.forEach((item) => {
    months.forEach((month) => {
      totals[month] += item.months[month] || 0
    })
  })

  return totals
}

// Función para calcular totales por número de parte
export const calculatePartTotals = (history: ForecastHistory) => {
  return history.items.map((item) => {
    const total = Object.values(item.months).reduce((sum, value) => sum + (value || 0), 0)
    return {
      custId: item.custId,
      vendorId: item.vendorId,
      partNumber: item.partNumber,
      partClient: item.partClient,
      productId: item.productId,
      description: item.description,
      total,
    }
  })
}

// Estructura simplificada para el componente de visualización
export type ForecastHistoryData = {
  client: string
  title: string
  lastUpdated: string
  hasCustId: boolean
  hasDescription: boolean
  data: any[]
}

// Convertir los historiales a un formato más simple para el componente
export const forecastHistories: ForecastHistoryData[] = [
  {
    client: "MARELLI",
    title: forecastHistoryWeek20.title,
    lastUpdated: forecastHistoryWeek20.lastUpdated,
    hasCustId: true,
    hasDescription: false,
    data: convertForecastHistoryToTableData(forecastHistoryWeek20),
  },
  {
    client: "VELVAC",
    title: forecastHistoryVelvac.title,
    lastUpdated: forecastHistoryVelvac.lastUpdated,
    hasCustId: true,
    hasDescription: true,
    data: convertForecastHistoryToTableData(forecastHistoryVelvac),
  },
  {
    client: "YETI",
    title: forecastHistoryYeti.title,
    lastUpdated: forecastHistoryYeti.lastUpdated,
    hasCustId: false,
    hasDescription: true,
    data: convertForecastHistoryToTableData(forecastHistoryYeti),
  },
  {
    client: "DONALDSON",
    title: forecastHistoryDonaldson.title,
    lastUpdated: forecastHistoryDonaldson.lastUpdated,
    hasCustId: true,
    hasDescription: true,
    data: convertForecastHistoryToTableData(forecastHistoryDonaldson),
  },
]
