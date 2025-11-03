/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ ADVERTENCIA: ignoreBuildErrors está en true, lo que oculta errores de TypeScript
    // Se recomienda cambiar a false y corregir los errores antes de producción
    // ignoreBuildErrors: false, // Descomentar cuando se resuelvan los errores de TypeScript
    ignoreBuildErrors: true, // Temporal - permite builds con errores de tipos
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
