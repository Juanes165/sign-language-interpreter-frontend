# 🌐 Sign Language Interpreter - Frontend

Sistema web de reconocimiento de gestos en lengua de señas con contribución colaborativa.

---

## 📚 Documentación

**3 guías esenciales organizadas en `docs/`:**

1. **[Arquitectura del Sistema](docs/01_ARQUITECTURA_SISTEMA.md)** - Visión técnica completa ⚙️
2. **[Guía de Configuración](docs/02_GUIA_CONFIGURACION.md)** - Setup y configuración 🔧
3. **[Guía de Usuario](docs/03_GUIA_USUARIO.md)** - Cómo usar y contribuir 👤

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
# Desde el backend (gesto_releasev1)
cp -r ../gesto_releasev1/models/modelo_tfjs_node/* public/models/

# Verificar archivos
ls public/models/
# Debe mostrar: model.json, weights.bin, words.json
```

---

## 🎯 Características

### **Reconocimiento de Gestos** (`/gestures`)
- 🎥 Reconocimiento en tiempo real
- 🧠 Modelo LSTM con TensorFlow.js
- 📊 14 gestos disponibles
- 💯 Indicador de confianza

### **Contribución Colaborativa** (`/contribute`)
- 🤝 Captura de nuevos gestos
- 📈 Estadísticas de usuario
- ☁️ Sincronización automática con Google Drive
- 🎯 14 gestos objetivo

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
│   └── 03_GUIA_USUARIO.md
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
│   └── lib/                       # Utilidades
│
├── public/
│   └── models/        # Modelo LSTM
│       ├── model.json
│       ├── weights.bin
│       └── words.json
│
├── unavoz-bb3744af7f68.json       # Credenciales Google Drive
└── package.json
```

---

## 🔧 Configuración de Google Drive

### **1. Obtener Credenciales**
- Crear Service Account en Google Cloud Console
- Descargar credenciales como JSON
- Copiar a la raíz del proyecto: `unavoz-bb3744af7f68.json`

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
```

---

## 🔗 Proyecto Relacionado

**Backend (Entrenamiento):**  
[gesto_releasev1](../gesto_releasev1/)
- Captura de datos con Python
- Entrenamiento del modelo LSTM
- Conversión a TensorFlow.js

---

## 📖 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](docs/01_ARQUITECTURA_SISTEMA.md) | Visión técnica del sistema |
| [Configuración](docs/02_GUIA_CONFIGURACION.md) | Setup completo |
| [Usuario](docs/03_GUIA_USUARIO.md) | Cómo usar el sistema |

---

## 📝 Licencia

[Especificar licencia aquí]

---

**🎯 Sistema web de reconocimiento de gestos con contribución colaborativa**
