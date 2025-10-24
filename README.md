# 🤟 Intérprete de Lengua de Señas

Aplicación web en tiempo real para interpretación de lengua de señas utilizando **MediaPipe** y **TensorFlow.js**.

## 🌟 Características

### 📝 Reconocimiento de Alfabeto (`/alphabet`)
- Detección de letras individuales A-Z + Ñ
- Reconocimiento instantáneo frame por frame
- Modelo ligero de MediaPipe Gesture Recognizer
- 27 clases de gestos estáticos

### 🎬 Reconocimiento de Gestos Dinámicos (`/gestures`)
- **NUEVO**: Interpretación de palabras completas
- Captura secuencias temporales de 15 frames
- Modelo LSTM entrenado personalizado
- MediaPipe Holistic (pose + cara + manos)
- Acumulación de frases de hasta 6 palabras
- Soporte para Text-to-Speech (opcional)

## 🚀 Inicio Rápido

### Instalación

```bash
# Clonar el repositorio
git clone [URL_DEL_REPO]
cd sign-language-interpreter-frontend

# Instalar dependencias
npm install

# Verificar integración LSTM
node verify-lstm-integration.js

# Iniciar servidor de desarrollo
npm run dev
```

### Acceder a la aplicación

- **Página principal**: http://localhost:3000
- **Alfabeto**: http://localhost:3000/alphabet
- **Gestos dinámicos**: http://localhost:3000/gestures

## 🏗️ Tecnologías

- **Framework**: [Next.js 15](https://nextjs.org) (React 19)
- **Visión por computadora**: 
  - [MediaPipe Gesture Recognizer](https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer) (alfabeto)
  - [MediaPipe Holistic](https://google.github.io/mediapipe/solutions/holistic) (gestos dinámicos)
- **Machine Learning**: [TensorFlow.js](https://www.tensorflow.org/js)
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com)
- **Lenguaje**: JavaScript (ES6+)

## 📁 Estructura del Proyecto

```
sign-language-interpreter-frontend/
├── public/
│   └── models/
│       ├── gesture_recognizer.task    # Modelo de alfabeto (MediaPipe)
│       └── lstm_gestos/               # Modelo de gestos dinámicos (TFJS)
│           ├── model.json
│           ├── group1-shard1of1.bin
│           └── words.json
├── src/
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── alphabet/page.js       # Página de alfabeto
│   │   │   └── gestures/page.js       # 🆕 Página de gestos dinámicos
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   │   ├── common/                    # Componentes reutilizables
│   │   └── nav/                       # Navegación
│   ├── hooks/
│   │   └── useGestureRecognitionLSTM.js  # 🆕 Hook para LSTM
│   ├── lib/
│   │   ├── gestureRecognitionLSTM.js     # 🆕 Utilidades LSTM
│   │   └── getVideoConstraints.js
│   └── utils/
│       └── icons.js
├── GESTOS_DINAMICOS.md               # 🆕 Documentación detallada LSTM
├── GUIA_RAPIDA.md                    # 🆕 Guía de uso rápido
└── verify-lstm-integration.js        # 🆕 Script de verificación
```

## 🎯 Modelos Disponibles

### 1. Alfabeto (MediaPipe Task)
- **Archivo**: `public/models/gesture_recognizer.task`
- **Tipo**: Gestos estáticos
- **Clases**: 27 (A-Z + Ñ)
- **Tamaño**: ~10 MB
- **Entrada**: 21 keypoints × 2 manos

### 2. Gestos Dinámicos (LSTM)
- **Archivos**: `public/models/lstm_gestos/`
- **Tipo**: Secuencias temporales
- **Clases**: 3 (hola, dias, paz)
- **Tamaño**: ~2 MB
- **Entrada**: 15 frames × 1662 keypoints
- **Arquitectura**: LSTM(64) → LSTM(128) → Dense(64) → Dense(3)

## 📚 Documentación

- **[GESTOS_DINAMICOS.md](./GESTOS_DINAMICOS.md)**: Documentación técnica completa del sistema LSTM
- **[GUIA_RAPIDA.md](./GUIA_RAPIDA.md)**: Guía de inicio rápido y solución de problemas

## 🔧 Configuración

### Ajustar sensibilidad del modelo LSTM

Edita `src/app/(main)/gestures/page.js`:

```javascript
const { ... } = useGestureRecognitionLSTM({
  threshold: 0.7,           // Confianza mínima (0.5-0.9)
  marginFrame: 1,           // Frames a ignorar al inicio
  delayFrames: 3,           // Frames extra para capturar movimiento
  maxSentenceLength: 6,     // Palabras máximas en frase
  enableSpeech: false,      // Activar Text-to-Speech
});
```

## 🐛 Solución de Problemas

### Verificar integridad del proyecto
```bash
node verify-lstm-integration.js
```

### La cámara no funciona
- Verifica permisos del navegador
- Usa HTTPS o localhost
- Cierra otras apps que usen la cámara

### El modelo no carga
```bash
# Verificar archivos del modelo
ls public/models/lstm_gestos/

# Si faltan, copiar desde el proyecto Python:
# (Ajusta las rutas según tu configuración)
cp -r ../Tesis/gesto_releasev1/models/modelo_tfjs/* public/models/lstm_gestos/
```

## 🧪 Testing

```bash
# Verificar instalación
node verify-lstm-integration.js

# Iniciar en modo desarrollo
npm run dev

# Build para producción
npm run build
npm start
```

## 📊 Comparativa: Alfabeto vs Gestos Dinámicos

| Aspecto | Alfabeto | Gestos Dinámicos |
|---------|----------|------------------|
| Tipo | Estático | Temporal |
| Clases | 27 letras | 3 palabras (expandible) |
| Latencia | Instantánea | 1-2 segundos |
| Keypoints | 42 (manos) | 1662 (cuerpo completo) |
| Modelo | MediaPipe Task | LSTM (TensorFlow.js) |
| Uso | Deletreo | Palabras completas |

## 🎨 Personalización

### Agregar más gestos al modelo LSTM

1. **Capturar nuevas secuencias** (en el proyecto Python):
```bash
cd ../Tesis/gesto_releasev1/src
python capture_sequences.py
```

2. **Re-entrenar el modelo**:
```bash
python train_lstm_actions.py
```

3. **Convertir a TensorFlow.js**:
```bash
python fix_and_convert_tfjs.py
```

4. **Copiar al frontend**:
```bash
cp -r ../models/modelo_tfjs/* ../../sign-language-interpreter-frontend/public/models/lstm_gestos/
```

## 📱 Compatibilidad

- ✅ Chrome 90+ (recomendado)
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ⚠️ Dispositivos móviles (rendimiento variable)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte de una tesis de investigación.

## 🙏 Agradecimientos

- [MediaPipe](https://mediapipe.dev) por las herramientas de visión por computadora
- [TensorFlow.js](https://www.tensorflow.org/js) por permitir ML en el navegador
- [Next.js](https://nextjs.org) por el framework

---

**Desarrollado con ❤️ para hacer la lengua de señas más accesible**
