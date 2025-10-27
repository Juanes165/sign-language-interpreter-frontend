# 🏗️ Arquitectura del Sistema - Sign Language Interpreter

Sistema web de reconocimiento de gestos en lengua de señas con contribución colaborativa.

---

## 📋 Resumen Ejecutivo

**Frontend Next.js + React** que permite:
1. 🎥 Reconocimiento de gestos en tiempo real
2. 🤝 Captura de contribuciones de usuarios
3. ☁️ Sincronización automática con Google Drive
4. 🧠 Integración con modelo LSTM en TensorFlow.js

---

## 🏗️ Arquitectura Completa

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

1. CAPTURA (Frontend Web)
   Usuario → Cámara → MediaPipe Holistic
                          ↓
   Extracción de keypoints:
   - 33 pose + 21×2 manos + 468 rostro = 1662 valores × 15 frames
                          ↓
   Reducción a 6 decimales (50% menos peso)

2. ALMACENAMIENTO (Google Drive)
   ☁️ Upload automático vía API
   📁 carpeta: 1jNbfTqDI2nqs6xX5tFxOrbneOV0vJQzg
   📄 Archivo: hola_1761524455360.json

3. PROCESAMIENTO (Backend Admin - gesto_releasev1)
   📥 Descarga desde Drive
   🔄 Convierte JSON → .npy
   💾 Genera: assets/data/keypoints/

4. ENTRENAMIENTO (train_lstm_node_v2.js)
   🧠 .npy → LSTM → modelo_tfjs_node/

5. DESPLIEGUE (Copy to Frontend)
   📦 Modelo → public/models/lstm_gestos/
   🌐 Predicciones en tiempo real
```

---

## 📁 Estructura del Proyecto

```
sign-language-interpreter-frontend/
│
├── 📂 src/
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── gestures/           # Reconocimiento en tiempo real
│   │   │   │   └── page.js
│   │   │   ├── contribute/         # Captura de contribuciones
│   │   │   │   └── page.js
│   │   │   └── alphabet/           # Abecedario estático
│   │   │       └── page.js
│   │   │
│   │   └── api/
│   │       └── gestures/
│   │           ├── save/           # Guardar en localStorage
│   │           │   └── route.js
│   │           ├── upload-to-drive/ # Subir a Google Drive
│   │           │   └── route.js
│   │           └── batch/          # Operaciones batch
│   │               └── route.js
│   │
│   ├── components/
│   │   ├── contribute/
│   │   │   └── GestureCapture.jsx  # Componente de captura
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── LoadingSpinner.js
│   │   └── nav/
│   │       └── Header.jsx
│   │
│   ├── hooks/
│   │   ├── useContributeCapture.js      # Lógica de captura
│   │   └── useGestureRecognitionLSTM.js # Lógica de reconocimiento
│   │
│   └── lib/
│       ├── gestureRecognitionLSTM.js    # Clase principal
│       ├── getVideoConstraints.js       # Config de cámara
│       └── saveToBackend.js             # Persistencia
│
├── 📂 public/
│   └── models/
│       ├── gesture_recognizer.task      # MediaPipe (no usado)
│       └── lstm_gestos/
│           ├── model.json               # Modelo LSTM
│           ├── weights.bin              # Pesos del modelo
│           └── words.json               # Lista de gestos
│
├── 📂 docs/                             # Documentación
│   ├── 01_ARQUITECTURA_SISTEMA.md       ← Estás aquí
│   ├── 02_GUIA_CONFIGURACION.md
│   └── 03_GUIA_USUARIO.md
│
├── unavoz-bb3744af7f68.json             # Credenciales Google Drive
├── package.json
└── next.config.mjs
```

---

## 🔧 Componentes Principales

### **1. Reconocimiento de Gestos (`/gestures`)**

**Archivo:** `src/app/(main)/gestures/page.js`

**Funcionalidades:**
- Carga modelo LSTM desde `/public/models/lstm_gestos/`
- Captura video en tiempo real (640×480, 30 FPS)
- Extrae keypoints con MediaPipe Holistic
- Procesa secuencias de 15 frames
- Muestra predicción con confianza

**Hook:** `useGestureRecognitionLSTM.js`

```javascript
const {
  videoRef,
  canvasRef,
  isInitialized,
  currentPrediction,
  isProcessing,
  error
} = useGestureRecognitionLSTM();
```

**Flujo:**
```
Cámara → MediaPipe → Buffer [15 frames] → Modelo LSTM → Predicción
```

---

### **2. Contribución de Gestos (`/contribute`)**

**Archivo:** `src/app/(main)/contribute/page.js`

**Funcionalidades:**
- 18 gestos predefinidos con emojis
- Estadísticas de usuario (contribuciones totales)
- Captura configurable (15 frames estándar)
- Feedback visual en tiempo real
- Exportación automática a Google Drive

**Hook:** `useContributeCapture.js`

```javascript
const {
  videoRef,
  canvasRef,
  isCapturing,
  captureProgress,
  capturedFrames,
  startCapture,
  resetCapture,
  error
} = useContributeCapture(selectedGesture);
```

**Flujo:**
```
Usuario selecciona gesto → Inicia captura → 15 frames → 
localStorage → Google Drive API → carpeta compartida
```

---

### **3. API Routes**

#### **`/api/gestures/save`**
- Guarda muestras en `localStorage`
- Formato: `gesture_{gestureName}_{timestamp}`

#### **`/api/gestures/upload-to-drive`**
- Sube JSON a Google Drive
- Service Account: `unavoz@unavoz.iam.gserviceaccount.com`
- Folder ID: `1jNbfTqDI2nqs6xX5tFxOrbneOV0vJQzg`

#### **`/api/gestures/batch`**
- Operaciones batch (futuro)

---

## 🔑 MediaPipe Holistic - Extracción de Keypoints

### **Configuración**

```javascript
holistic.setOptions({
  modelComplexity: 1,           // Balance precisión/velocidad
  smoothLandmarks: true,        // Suavizado activado
  enableSegmentation: false,
  refineFaceLandmarks: false,   // No necesario para gestos
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
```

### **Keypoints Extraídos**

| Parte | Keypoints | Valores (x, y, z) |
|-------|-----------|-------------------|
| Pose | 33 | 99 |
| Mano Izquierda | 21 | 63 |
| Mano Derecha | 21 | 63 |
| Rostro | 468 | 1404 |
| **Total** | **543** | **1662** |

### **Formato de Salida**

```javascript
{
  "gesture": "hola",
  "gestureName": "Hola",
  "timestamp": 1761533206242,
  "totalFrames": 36,
  "keypoints": [
    [0.612198, 0.467799, -1.084693, ...], // Frame 1 (1662 valores)
    [0.634404, 0.414159, -1.009505, ...], // Frame 2 (1662 valores)
    ...
  ]
}
```

---

## 🧠 Modelo LSTM - TensorFlow.js

### **Arquitectura**

```
Input: (None, 15, 1662)
  ↓
LSTM Layer 1: 64 units + Dropout 0.4
  ↓
Batch Normalization
  ↓
LSTM Layer 2: 64 units + Dropout 0.4
  ↓
Batch Normalization
  ↓
Dense: 32 units (ReLU)
  ↓
Output: 18 clases (Softmax)
```

### **Carga del Modelo**

```javascript
import * as tf from '@tensorflow/tfjs';

const model = await tf.loadLayersModel('/models/lstm_gestos/model.json');
const words = await fetch('/models/lstm_gestos/words.json').then(r => r.json());
```

### **Predicción**

```javascript
// Input: secuencia de 15 frames × 1662 keypoints
const keypointsSequence = tf.tensor3d([keypoints], [1, 15, 1662]);

// Predicción
const prediction = model.predict(keypointsSequence);
const gestureIndex = prediction.argMax(-1).dataSync()[0];
const confidence = prediction.max().dataSync()[0];

// Mapear a nombre
const gestureName = words.word_ids[gestureIndex];
```

---

## ☁️ Integración con Google Drive

### **Service Account**

- Email: `unavoz@unavoz.iam.gserviceaccount.com`
- Credenciales: `unavoz-bb3744af7f68.json`
- Permisos: Editor (lectura/escritura)

### **Folder ID**

```
1jNbfTqDI2nqs6xX5tFxOrbneOV0vJQzg
```

**URL:** [https://drive.google.com/drive/folders/1jNbfTqDI2nqs6xX5tFxOrbneOV0vJQzg](https://drive.google.com/drive/folders/1jNbfTqDI2nqs6xX5tFxOrbneOV0vJQzg)

### **Upload desde Frontend**

```javascript
// src/app/api/gestures/upload-to-drive/route.js
const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

await drive.files.create({
  requestBody: {
    name: `${gesture}_${timestamp}.json`,
    parents: [folderId],
    mimeType: 'application/json'
  },
  media: {
    mimeType: 'application/json',
    body: JSON.stringify(sample)
  }
});
```

---

## 📊 Flujo de Datos

### **1. Captura → Almacenamiento**

```
Usuario captura gesto
  ↓
MediaPipe extrae keypoints (1662 × 15)
  ↓
Reducción a 6 decimales
  ↓
Guarda en localStorage
  ↓
Sube a Google Drive automáticamente
```

### **2. Procesamiento → Entrenamiento**

```
Admin descarga desde Drive
  ↓
Convierte JSON → .npy (Python)
  ↓
Entrena modelo (Node.js)
  ↓
Exporta TensorFlow.js
  ↓
Copia al frontend
```

### **3. Reconocimiento en Tiempo Real**

```
Usuario abre /gestures
  ↓
Carga modelo LSTM
  ↓
Captura video (30 FPS)
  ↓
Procesa cada frame con MediaPipe
  ↓
Buffer de 15 frames
  ↓
Predicción con LSTM
  ↓
Muestra resultado con confianza
```

---

## 🎯 Características Técnicas

### **Performance**

| Métrica | Valor |
|---------|-------|
| FPS cámara | 30 |
| Resolución | 640×480 |
| Latencia predicción | ~150-200ms |
| Frames por predicción | 15 |
| Keypoints por frame | 1662 |
| Tamaño modelo | ~5 MB |

### **Compatibilidad**

- ✅ Chrome/Edge (Chromium) 90+
- ✅ Firefox 88+
- ✅ Safari 14+ (macOS/iOS)
- ❌ Internet Explorer (no soportado)

---

## 🔗 Documentación Relacionada

- [Guía de Configuración](02_GUIA_CONFIGURACION.md) - Setup del frontend
- [Guía de Usuario](03_GUIA_USUARIO.md) - Cómo contribuir y usar

---

**🎯 Arquitectura optimizada para reconocimiento en tiempo real y contribución colaborativa**

