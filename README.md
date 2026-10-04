# 🌐 Sign Language Interpreter - Frontend

Sistema web de reconocimiento de gestos en lengua de señas con contribución colaborativa.

---

## 📚 Documentación

**Guías en `docs/`:**

1. **[Arquitectura del Sistema](docs/01_ARQUITECTURA_SISTEMA.md)** - Visión técnica completa ⚙️
2. **[Guía de Configuración](docs/02_GUIA_CONFIGURACION.md)** - Setup y configuración 🔧
3. **[Guía de Usuario](docs/03_GUIA_USUARIO.md)** - Cómo usar y contribuir 👤
4. **[Modelo v7](docs/04_MODELO_V7.md)** - Preprocesamiento, métricas y umbrales (**vigente**: donde difiera de 01–03, manda este)

---

## 🚀 Inicio Rápido

### **Instalación**

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/sign-language-interpreter-frontend.git
cd sign-language-interpreter-frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

Abrir: [http://localhost:3000](http://localhost:3000)

---

### **Copiar Modelo Entrenado**

```bash
# Desde el repo de entrenamiento (Tesis/gesto_releasev1), tras correr src/train_v7.py
cp ../Tesis/gesto_releasev1/models/v7/{model.json,weights.bin,words.json,model_config.json} public/models/

# Verificar archivos
ls public/models/
# Debe mostrar: model.json, weights.bin, words.json, model_config.json (+ gesture_recognizer.task)
```

`model_config.json` lo genera el entrenamiento (número de frames, umbral de confianza, margen y clases). **El front no arranca el reconocimiento sin él**, y `npm test` verifica que el modelo cargue en TF.js y dé las mismas probabilidades que Keras.

---

## 🎯 Características

### **Reconocimiento de Gestos** (`/gestures`)
- 🎥 Reconocimiento en tiempo real
- 🧠 Modelo LSTM con TensorFlow.js (v7, landmarks relativos al cuerpo)
- 📊 18 señas disponibles
- 💯 Indicador de confianza, con rechazo de señas dudosas o ambiguas
- 🔊 Lectura en voz alta de la frase (voz del navegador, sin servicios externos)
- 📝 Frase en orden de lectura, con botón de copiar

### **Contribución Colaborativa** (`/contribute`)
- 🤝 Captura de nuevos gestos
- 📈 Estadísticas de usuario
- ☁️ Sincronización automática con Google Drive
- 🎯 18 gestos objetivo

### **Abecedario** (`/alphabet`)
- 📚 Señas estáticas (A-Z)
- 🖼️ Imágenes de referencia

---

## 📁 Estructura del Proyecto

```
sign-language-interpreter-frontend/
├── docs/                          # 📚 Documentación
│   ├── 01_ARQUITECTURA_SISTEMA.md
│   ├── 02_GUIA_CONFIGURACION.md
│   ├── 03_GUIA_USUARIO.md
│   └── 04_MODELO_V7.md
│
├── src/
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── gestures/          # Reconocimiento
│   │   │   ├── contribute/        # Contribución
│   │   │   └── alphabet/          # Abecedario
│   │   └── api/gestures/          # API Routes
│   │
│   ├── components/                # Componentes React
│   ├── hooks/                     # Custom hooks
│   └── lib/                       # preprocess.js, recognition.js, speech.js...
│
├── tests/                         # Vitest (paridad con Python, decisión, modelo)
│
├── public/
│   └── models/        # Modelo LSTM
│       ├── model.json
│       ├── weights.bin
│       ├── words.json
│       └── model_config.json
│
└── package.json
```

---

## 🔧 Configuración de Google Drive

### **1. Obtener Credenciales**
- Crear Service Account en Google Cloud Console
- Descargar credenciales como JSON
- Copiar a la raíz del proyecto: `unavoz-bb3744af7f68.json`
- ⚠️ **No subas ese archivo al repositorio.** Una llave commiteada queda en el historial de git aunque la borres: rótala/revócala en Google Cloud y agrégala al `.gitignore`.

### **2. Compartir Carpeta**
- Crear carpeta en Google Drive
- Compartir con: `unavoz@unavoz.iam.gserviceaccount.com`
- Permisos: **Editor**

### **3. Configurar Folder ID**
Editar `src/app/api/gestures/upload-to-drive/route.js`:

```javascript
const folderId = 'TU_FOLDER_ID_AQUI';
```

**[Ver guía completa →](docs/02_GUIA_CONFIGURACION.md#paso-3-configurar-google-drive-opcional)**

---

## 🎨 Tecnologías

- **Framework:** Next.js 15
- **UI:** React 19 + Tailwind CSS
- **ML:** TensorFlow.js
- **Computer Vision:** MediaPipe Holistic
- **Cloud:** Google Drive API

---

## 📦 Comandos Disponibles

```bash
npm run dev      # Desarrollo (http://localhost:3000)
npm run build    # Build para producción
npm run start    # Iniciar producción
npm run lint     # Linter
npm test         # Tests (Vitest)
```

---

## 🔗 Proyecto Relacionado

**Backend (Entrenamiento):**  
[gesto_releasev1](../gesto_releasev1/)
- Captura de datos con Python
- Preparación del dataset y entrenamiento del modelo v7 (`src/train_v7.py`)
- Exportación a TensorFlow.js (`src/export_tfjs.py`)

---

## 📖 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](docs/01_ARQUITECTURA_SISTEMA.md) | Visión técnica del sistema |
| [Configuración](docs/02_GUIA_CONFIGURACION.md) | Setup completo |
| [Usuario](docs/03_GUIA_USUARIO.md) | Cómo usar el sistema |
| [Modelo v7](docs/04_MODELO_V7.md) | Preprocesamiento, métricas y umbrales |

---

## 📝 Licencia

[Especificar licencia aquí]

---

**🎯 Sistema web de reconocimiento de gestos con contribución colaborativa**
