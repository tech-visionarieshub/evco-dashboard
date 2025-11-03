# Guía de Verificación para Producción

## Problema
La aplicación funciona correctamente en local pero no en producción (Vercel).

## Solución Paso a Paso

### 1. Verificar Variables de Entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `evco-dashboard`
3. Ve a **Settings** → **Environment Variables**
4. Verifica que todas estas variables estén configuradas:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 2. Limpiar Variables de Entorno (IMPORTANTE)

**Problema común:** Las variables pueden tener espacios o saltos de línea al final.

**Solución:**
1. Para cada variable de entorno:
   - Haz clic en **Edit**
   - **Copia** el valor completo
   - **Pégalo en un editor de texto** (Notepad, TextEdit)
   - **Elimina cualquier espacio** al inicio o al final
   - **Elimina cualquier salto de línea** al final
   - **Copia** el valor limpio
   - **Pégalo de nuevo** en Vercel
   - Guarda

2. **Especial atención a `NEXT_PUBLIC_FIREBASE_PROJECT_ID`:**
   - Debe ser exactamente: `customerservice-29059`
   - Sin espacios antes o después
   - Sin saltos de línea

### 3. Verificar Valores Correctos

Asegúrate de que los valores sean exactamente estos (sin espacios extra):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAlAXW7p2AqSf_TBC5I2shlCJHLgcF4cPs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=customerservice-29059.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=customerservice-29059
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=customerservice-29059.firebasestorage.app
NEXT_PUBLIC_FIREBASE_APP_ID=1:392096692021:web:f1fc2bfb61caeaedde3e7c
```

### 4. Redesplegar

Después de actualizar las variables:
1. Ve a **Deployments**
2. Haz clic en el menú (⋯) del último deployment
3. Selecciona **Redeploy**
4. O mejor aún, haz un nuevo commit y push para activar un nuevo deployment

### 5. Verificar Autenticación Anónima en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `customerservice-29059`
3. Ve a **Authentication** → **Sign-in method**
4. Verifica que **Anonymous** esté **habilitado**
5. Si no está habilitado, **Habilítalo**

### 6. Verificar Reglas de Firestore

1. En Firebase Console, ve a **Firestore Database** → **Rules**
2. Asegúrate de que las reglas permitan lectura con autenticación anónima:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura si el usuario está autenticado (incluyendo anónimo)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 7. Verificar Logs en Producción

1. Abre la aplicación en producción
2. Abre la **Consola del Navegador** (F12)
3. Busca logs que empiecen con `[Firebase]` o `[Dashboard]`
4. Si ves errores, revisa:
   - **Errores de configuración** → Variables de entorno incorrectas
   - **Errores de autenticación** → Autenticación anónima no habilitada
   - **Errores 400 Bad Request** → Variables con saltos de línea (especialmente projectId)
   - **Errores de permisos** → Reglas de Firestore incorrectas

### 8. Comandos Útiles para Verificar

Puedes usar el siguiente comando para verificar las variables en Vercel:

```bash
vercel env ls
```

Para ver el valor de una variable específica (sin mostrarla por seguridad):

```bash
vercel env pull .env.production
```

Luego revisa el archivo `.env.production` localmente.

## Checklist de Verificación

- [ ] Todas las variables de entorno están configuradas en Vercel
- [ ] Las variables no tienen espacios al inicio o al final
- [ ] Las variables no tienen saltos de línea al final
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` es exactamente `customerservice-29059`
- [ ] Autenticación anónima está habilitada en Firebase
- [ ] Reglas de Firestore permiten acceso autenticado
- [ ] Se ha redeployado después de cambios
- [ ] Logs en consola del navegador no muestran errores de configuración

## Solución Rápida

Si el problema persiste después de seguir estos pasos:

1. **Elimina todas las variables de entorno** en Vercel
2. **Vuelve a agregarlas una por una**, copiando directamente desde `.env.local` (sin espacios extra)
3. **Redeploy** la aplicación
4. **Verifica los logs** en la consola del navegador

## Contacto

Si después de seguir estos pasos el problema persiste, comparte:
- Los logs de la consola del navegador (filtrados por `[Firebase]` y `[Dashboard]`)
- Capturas de pantalla de las variables de entorno en Vercel (oculta los valores por seguridad)

