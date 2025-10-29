# ⚙️ Guía de Configuración - Sign Language Interpreter Frontend

Configuración completa del frontend Next.js para reconocimiento y contribución de gestos.

---

## 📋 Requisitos Previos

### **Software Necesario**

- **Node.js**: v18+ (recomendado v20 LTS)
- **NPM**: v9+ o **pnpm**: v8+
- **Git**: Para clonar el repositorio
- **Navegador moderno**: Chrome/Edge 90+, Firefox 88+, Safari 14+

### **Hardware Recomendado**

- **Cámara web**: Cualquier webcam compatible (mínimo 480p)
- **RAM**: 4GB mínimo (8GB recomendado)
- **CPU**: Dual-core 2GHz+
- **Conexión**: Internet estable para Google Drive

---

## 🚀 Instalación

### **Paso 1: Clonar el Repositorio**

```bash
git clone https://github.com/tu-usuario/sign-language-interpreter-frontend.git
cd sign-language-interpreter-frontend
```

---

### **Paso 2: Instalar Dependencias**

```bash
npm install
# o
pnpm install
```

**Principales dependencias:**

```json
{
  "@mediapipe/holistic": "^0.5.1675471629",
  "@tensorflow/tfjs": "^4.22.0",
  "next": "15.0.3",
  "react": "^19.0.0",
  "googleapis": "^144.0.0"
}
```

---

### **Paso 3: Configurar Google Drive (Opcional)**

Si quieres habilitar la subida automática a Google Drive:

#### **3.1 Obtener Credenciales**

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear/seleccionar proyecto
3. Habilitar Google Drive API
4. Crear Service Account
5. Descargar credenciales como JSON

#### **3.2 Colocar Credenciales**

```bash
# Copiar archivo de credenciales a la raíz del proyecto
cp ~/Downloads/unavoz-bb3744af7f68.json .

# Verificar que esté en .gitignore
cat .gitignore | grep "credentials"
```

**Archivo `.gitignore` debe contener:**

```gitignore
# Google Drive credentials (security)
*credentials*.json
*-bb3744af7f68.json
unavoz-bb3744af7f68.json
```

#### **3.3 Compartir Carpeta de Drive**

1. Crear carpeta en Google Drive
2. Click derecho → "Compartir"
3. Agregar: `unavoz@unavoz.iam.gserviceaccount.com`
4. Permisos: **Editor**
5. Copiar el **Folder ID** de la URL

**Ejemplo de URL:**
```
https://drive.google.com/drive/folders/1zkP5QPXCZU1nM2hL11r6VIzK0053yNtb
                                         ↑
                                    Folder ID
```

#### **3.4 Configurar en el Código**

Editar `src/app/api/gestures/upload-to-drive/route.js`:

```javascript
const folderId = '1zkP5QPXCZU1nM2hL11r6VIzK0053yNtb'; // Tu Folder ID
```

---

### **Paso 4: Copiar Modelo LSTM**

Si ya tienes un modelo entrenado:

```bash
# Copiar desde el backend
cp -r ../gesto_releasev1/models/modelo_tfjs_node/* public/models/

# Verificar archivos
ls public/models/
# Debe mostrar: model.json, weights.bin, words.json
```

Si NO tienes modelo, puedes usar el modelo de ejemplo (si existe) o entrenar uno nuevo siguiendo la [documentación del backend](../../gesto_releasev1/docs/03_FLUJO_MIXTO.md).

---

### **Paso 5: Ejecutar en Desarrollo**

```bash
npm run dev
# o
pnpm dev
```

**Salida esperada:**

```
  ▲ Next.js 15.0.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.100:3000

 ✓ Ready in 2.5s
```

Abrir en navegador: [http://localhost:3000](http://localhost:3000)

---

## 🔧 Configuración Avanzada

### **1. Configuración de la Cámara**

Editar `src/lib/getVideoConstraints.js`:

```javascript
export function getVideoConstraints() {
  return {
    video: {
      width: { ideal: 640 },      // Resolución horizontal
      height: { ideal: 480 },     // Resolución vertical
      frameRate: { ideal: 30, max: 30 },  // FPS
      facingMode: 'user'          // Cámara frontal
    },
    audio: false
  };
}
```

---

### **2. Configuración de MediaPipe**

Editar `src/hooks/useContributeCapture.js`:

```javascript
holistic.setOptions({
  modelComplexity: 1,           // 0=lite, 1=full, 2=heavy
  smoothLandmarks: true,        // Suavizado de keypoints
  enableSegmentation: false,    // Segmentación de fondo (no necesario)
  refineFaceLandmarks: false,   // Refinamiento facial (no necesario)
  minDetectionConfidence: 0.5,  // Umbral de detección
  minTrackingConfidence: 0.5    // Umbral de seguimiento
});
```

**Recomendaciones:**

| Prioridad | `modelComplexity` | `smoothLandmarks` | Performance |
|-----------|-------------------|-------------------|-------------|
| Velocidad | 0 | false | ⚡⚡⚡ Alta |
| Balance | 1 | true | ⚡⚡ Media |
| Precisión | 2 | true | ⚡ Baja |

---

### **3. Configuración de Captura**

Editar `src/hooks/useContributeCapture.js`:

```javascript
const CAPTURE_CONFIG = {
  MODEL_FRAMES: 15,              // Frames a capturar
  FRAME_INTERVAL_MS: 100,        // Intervalo entre frames (ms)
  COUNTDOWN_SECONDS: 3,          // Cuenta regresiva antes de capturar
  KEYPOINT_DECIMALS: 6           // Decimales para reducir peso
};
```

**Cálculos:**

```
Duración de captura = MODEL_FRAMES × FRAME_INTERVAL_MS
15 frames × 100ms = 1500ms = 1.5 segundos
```

---

### **4. Lista de Gestos Disponibles**

Editar `src/app/(main)/contribute/page.js`:

```javascript
const AVAILABLE_GESTURES = [
  { id: 'sordo', label: 'Sordo', description: 'Persona sorda', emoji: '👂' },
  { id: 'hola', label: 'Hola', description: 'Saludo básico', emoji: '👋' },
  { id: 'como-estas', label: '¿Cómo estás?', description: 'Pregunta', emoji: '🤔' },
  // ... agregar más gestos
];
```

**Formato del ID:**
- Minúsculas
- Sin espacios (usar guiones)
- Sin acentos ni caracteres especiales

**Ejemplo:**
- ❌ `Buenos Días`
- ❌ `buenos_días`
- ✅ `buenos-dias`

---

### **5. Configuración de Predicción en Tiempo Real**

Editar `src/hooks/useGestureRecognitionLSTM.js`:

```javascript
const CONFIG = {
  MODEL_FRAMES: 15,                    // Frames para predicción
  LENGTH_KEYPOINTS: 1662,              // Keypoints por frame
  PREDICTION_THRESHOLD: 0.6,           // Umbral de confianza mínimo
  BUFFER_SIZE: 15,                     // Tamaño del buffer
  PREDICTION_INTERVAL_MS: 500          // Intervalo entre predicciones
};
```

**Umbrales de confianza:**

| Umbral | Comportamiento |
|--------|----------------|
| 0.5 | Muy permisivo (muchas predicciones) |
| 0.6 | Balanceado ⭐ |
| 0.7 | Estricto (menos false positives) |
| 0.8 | Muy estricto (solo alta confianza) |

---

## 🎨 Personalización de UI

### **Colores del Tema**

Editar `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'rich-black': '#020617',
        'space-cadet': '#1e293b',
        'wisteria': '#a855f7',
        'heliotrope': '#c084fc',
        'platinum': '#e2e8f0',
        'light-gray': '#cbd5e1',
      }
    }
  }
}
```

---

### **Textos y Traducciones**

Para cambiar textos de la interfaz, editar directamente los archivos de página:

- `src/app/(main)/gestures/page.js` - Página de reconocimiento
- `src/app/(main)/contribute/page.js` - Página de contribución
- `src/app/(main)/alphabet/page.js` - Página de abecedario

---

## 🔒 Seguridad

### **1. Variables de Entorno (NO USAR)**

**⚠️ IMPORTANTE:** Las credenciales de Google Drive NO deben estar en variables de entorno en el frontend, ya que serían expuestas al navegador.

**Método correcto:**
- Credenciales en archivo JSON en la raíz
- Leídas solo por API Routes (server-side)
- Nunca expuestas al cliente

---

### **2. Archivo `.gitignore`**

Verificar que el archivo `.gitignore` contenga:

```gitignore
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# Google Drive credentials (security)
*credentials*.json
*-bb3744af7f68.json
unavoz-bb3744af7f68.json
```

---

## 📦 Build para Producción

### **Paso 1: Build**

```bash
npm run build
# o
pnpm build
```

**Salida esperada:**

```
Route (app)                                Size     First Load JS
┌ ○ /                                      5.2 kB         92.1 kB
├ ○ /_not-found                            0 B              0 B
├ ○ /alphabet                              8.4 kB         95.3 kB
├ ○ /contribute                            12.6 kB        99.5 kB
└ ○ /gestures                              15.2 kB        102.1 kB

○  (Static)  prerendered as static content

✓ Compiled successfully
```

---

### **Paso 2: Iniciar en Producción**

```bash
npm run start
# o
pnpm start
```

---

### **Paso 3: Despliegue en Vercel**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel

# Producción
vercel --prod
```

**Configuración en Vercel:**
1. Agregar `unavoz-bb3744af7f68.json` como archivo en el proyecto (no como variable de entorno)
2. Asegurar que `.gitignore` no excluya el archivo durante el build
3. Verificar que las rutas API funcionen correctamente

---

## 🧪 Testing

### **Verificar Cámara**

```bash
# Abrir en navegador
http://localhost:3000/gestures

# Debe solicitar permisos de cámara
# Si no funciona, verificar:
# 1. Permisos del navegador
# 2. HTTPS (requerido en producción)
# 3. Configuración de cámara en sistema operativo
```

---

### **Verificar Modelo**

```bash
# Abrir consola del navegador (F12)
# Debe mostrar:
✅ Modelo LSTM cargado: /models/model.json
✅ Gestos disponibles: 18
```

---

### **Verificar Google Drive**

```bash
# Capturar un gesto en /contribute
# Verificar en Google Drive que se haya subido
# URL: https://drive.google.com/drive/folders/1zkP5QPXCZU1nM2hL11r6VIzK0053yNtb
```

---

## ❓ Troubleshooting

### **Error: "Camera not accessible"**

**Solución:**
```bash
# 1. Verificar permisos del navegador
# 2. En Chrome: chrome://settings/content/camera
# 3. En producción, usar HTTPS obligatorio
```

---

### **Error: "Model not found"**

**Solución:**
```bash
# Verificar que existan los archivos
ls public/models/
# Debe mostrar: model.json, weights.bin, words.json

# Si faltan, copiar desde backend:
cp -r ../gesto_releasev1/models/modelo_tfjs_node/* public/models/
```

---

### **Error: "Google Drive upload failed"**

**Solución:**
```bash
# 1. Verificar credenciales
cat unavoz-bb3744af7f68.json

# 2. Verificar que la carpeta esté compartida con el service account
# Email: unavoz@unavoz.iam.gserviceaccount.com
# Permisos: Editor

# 3. Verificar logs en terminal del servidor Next.js
```

---

## 🔗 Documentación Relacionada

- [Arquitectura del Sistema](01_ARQUITECTURA_SISTEMA.md)
- [Guía de Usuario](03_GUIA_USUARIO.md)
- [Backend - Flujo Mixto](../../gesto_releasev1/docs/03_FLUJO_MIXTO.md)

---

**⚙️ Configuración completa para desarrollo y producción**

