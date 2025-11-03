-- Crear extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cust_id VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  numero_orden VARCHAR(100),
  cliente_id UUID REFERENCES clientes(id),
  fecha_orden DATE,
  fecha_requerimiento DATE,
  direccion_envio TEXT,
  tipo_orden VARCHAR(50),
  moneda VARCHAR(10) DEFAULT 'USD',
  estado VARCHAR(50) DEFAULT 'borrador',
  archivo_original TEXT,
  contenido_original TEXT,
  progreso_paso INTEGER DEFAULT 1,
  datos_extraidos JSONB,
  confianza DECIMAL(3,2),
  advertencias TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de líneas de orden
CREATE TABLE IF NOT EXISTS lineas_orden (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  orden_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  numero_linea INTEGER,
  sku_cliente VARCHAR(100),
  sku_evco VARCHAR(100),
  descripcion TEXT,
  cantidad INTEGER,
  precio DECIMAL(10,2),
  unidad VARCHAR(20),
  ship_to VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de procesamiento
CREATE TABLE IF NOT EXISTS historial_procesamiento (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  orden_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  paso INTEGER NOT NULL,
  datos_paso JSONB,
  tiempo_procesamiento INTEGER,
  usuario VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_clientes_cust_id ON clientes(cust_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente_id ON ordenes_compra(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes_compra(created_at);
CREATE INDEX IF NOT EXISTS idx_lineas_orden_id ON lineas_orden(orden_id);
CREATE INDEX IF NOT EXISTS idx_historial_orden_id ON historial_procesamiento(orden_id);
