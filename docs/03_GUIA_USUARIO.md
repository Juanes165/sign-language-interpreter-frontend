# 👤 Guía de Usuario - Sign Language Interpreter

Aprende a usar el sistema de reconocimiento de gestos y a contribuir con nuevas muestras.

---

## 📋 Índice

1. [Reconocimiento de Gestos](#-reconocimiento-de-gestos) - Usar el sistema
2. [Contribuir Gestos](#-contribuir-gestos) - Ayudar a mejorar el modelo
3. [Abecedario](#-abecedario) - Aprender señas estáticas
4. [Consejos y Mejores Prácticas](#-consejos-y-mejores-prácticas)
5. [Preguntas Frecuentes](#-preguntas-frecuentes)

---

## 🎥 Reconocimiento de Gestos

### **Cómo Usar**

1. **Acceder a la página**
   - Ir a: [http://localhost:3000/gestures](http://localhost:3000/gestures)
   - O hacer clic en "Gestos" en el menú

2. **Dar permisos a la cámara**
   - El navegador solicitará acceso a la cámara
   - Hacer clic en "Permitir"
   
3. **Realizar el gesto**
   - Posicionarte frente a la cámara
   - Realizar el gesto lentamente
   - Mantenerlo por ~1-2 segundos

4. **Ver la predicción**
   - El sistema mostrará el gesto detectado
   - Indicador de confianza (%)
   - Barra de color:
     - 🟢 Verde (80%+): Alta confianza
     - 🟡 Amarillo (60-80%): Media confianza
     - 🔴 Rojo (<60%): Baja confianza

---

### **Gestos Disponibles**

| Emoji | Gesto | Descripción |
|-------|-------|-------------|
| 👎 | Mal | Respuesta negativa |
| 👋 | Hola | Saludo básico |
| 😔 | Lo siento | Disculpa formal |
| 👂 | Sordo | Persona sorda |
| 🤷 | Más o menos | Respuesta neutral |
| 👍 | Bien | Respuesta positiva |
| 🌤️ | Buenas tardes | Saludo vespertino |
| 👋 | Adiós | Despedida |
| 🎂 | Feliz cumpleaños | Celebración |
| 🙏 | Gracias | Agradecimiento |
| 🌙 | Buenas noches | Saludo nocturno |
| 🤔 | ¿Cómo estás? | Pregunta de cortesía |
| 🚶 | Permiso | Solicitud de paso |
| ☀️ | Buenos días | Saludo matutino |

**Total: 14 gestos**

---

### **Consejos para Mejor Reconocimiento**

#### ✅ **Hacer**

- ✅ Iluminación frontal y uniforme
- ✅ Fondo limpio y sin movimiento
- ✅ Posición centrada en la cámara
- ✅ Gestos lentos y claros
- ✅ Mantener el gesto 1-2 segundos
- ✅ Manos visibles y completas en el cuadro

#### ❌ **Evitar**

- ❌ Contraluz (luz detrás de ti)
- ❌ Sombras sobre las manos
- ❌ Movimientos muy rápidos
- ❌ Manos cortadas por el encuadre
- ❌ Objetos que cubran las manos
- ❌ Fondos con mucho movimiento

---

## 🤝 Contribuir Gestos

### **¿Por Qué Contribuir?**

Tus contribuciones ayudan a:
- 🎯 Mejorar la precisión del modelo
- 🌍 Aumentar la diversidad de datos
- 🤝 Hacer el sistema más robusto
- 📈 Reconocer más variaciones de gestos

---

### **Cómo Contribuir**

#### **Paso 1: Acceder**
- Ir a: [http://localhost:3000/contribute](http://localhost:3000/contribute)
- O hacer clic en "Contribuir" en el menú

---

#### **Paso 2: Ver Tus Estadísticas**

```
🎉 ¡Gran trabajo!
Has contribuido con 23 muestras en 4 gestos diferentes

Objetivo: Capturar los 14 gestos
Progreso: 4 / 14 (29%)
```

---

#### **Paso 3: Seleccionar Gesto**

1. Ver la lista de 14 gestos disponibles
2. Hacer clic en el gesto que quieras capturar
3. Ver instrucciones del gesto (si disponibles)

---

#### **Paso 4: Preparar Captura**

1. **Posicionarte frente a la cámara**
   - Distancia: ~1 metro
   - Altura: Cámara a nivel de pecho/cara
   - Iluminación: Frontal y uniforme

2. **Verificar encuadre**
   - Ver el rectángulo de referencia
   - Asegurar que todo el cuerpo superior esté visible
   - Manos completamente en cuadro

3. **Hacer clic en "Iniciar Captura"**

---

#### **Paso 5: Capturar**

1. **Cuenta regresiva**
   ```
   Preparándote...
   3... 2... 1...
   ```

2. **Captura en progreso**
   ```
   🎥 Capturando...
   Frames: 8 / 15
   [████████░░░░░░░] 53%
   ```

3. **Realizar el gesto**
   - Mantener el gesto estable
   - No moverse bruscamente
   - Duración: ~1.5 segundos

4. **Captura completa**
   ```
   ✅ ¡Muestra capturada con éxito!
   
   Opciones:
   [Guardar] [Reintentar]
   ```

---

#### **Paso 6: Guardar**

1. **Hacer clic en "Guardar"**
   - Se guarda en localStorage
   - Se sube automáticamente a Google Drive

2. **Confirmación**
   ```
   ✅ Muestra guardada: hola_1761533206242.json
   📤 Subida a Drive: exitosa
   
   Total de muestras: 24
   ```

3. **Capturar más muestras**
   - Se recomienda 3-5 muestras por gesto
   - Variar posición y velocidad ligeramente

---

### **Mejores Prácticas para Contribuir**

#### **1. Diversidad**
- Capturar desde diferentes ángulos
- Variar velocidad del gesto
- Diferentes posiciones en el encuadre

#### **2. Calidad**
- Buena iluminación
- Manos completamente visibles
- Gesto claro y reconocible

#### **3. Cantidad**
- Mínimo: 3 muestras por gesto
- Recomendado: 5-10 muestras
- Ideal: 15+ muestras

#### **4. Variedad**
- Contribuir a todos los 14 gestos
- Diferentes momentos del día
- Diferentes condiciones de luz

---

## 📚 Abecedario

### **Cómo Usar**

1. Ir a: [http://localhost:3000/alphabet](http://localhost:3000/alphabet)
2. Ver las imágenes de cada letra
3. Practicar la seña frente a un espejo
4. Probar en el modo de reconocimiento

**Nota:** El abecedario está en formato de imágenes estáticas, no reconocimiento en tiempo real (por ahora).

---

## 💡 Consejos y Mejores Prácticas

### **Configuración de Cámara**

#### **Iluminación**
- 💡 Luz frontal (delante de ti)
- 🌤️ Luz natural indirecta
- 💡 Evitar luz directa del sol
- 🔆 Luz artificial uniforme

#### **Posición**
```
        [Cámara]
           ↓
    ┌─────────────┐
    │             │
    │    👤       │  ← Tú centrado
    │   🙌       │  ← Manos visibles
    │             │
    └─────────────┘
```

#### **Fondo**
- ✅ Pared lisa
- ✅ Color uniforme
- ❌ Evitar fondos con movimiento
- ❌ Evitar patrones complejos

---

### **Performance**

#### **Si el sistema está lento:**

1. **Cerrar otras pestañas del navegador**
2. **Cerrar otras aplicaciones**
3. **Reducir calidad de cámara** (si es configurable)
4. **Usar navegador basado en Chromium** (Chrome/Edge)

#### **Si la cámara no funciona:**

1. **Verificar permisos del navegador**
   - Chrome: `chrome://settings/content/camera`
   - Firefox: Icono de candado → Permisos
   
2. **Verificar que la cámara no esté en uso**
   - Cerrar otras apps (Zoom, Teams, etc.)
   
3. **Probar con otro navegador**

---

## ❓ Preguntas Frecuentes

### **1. ¿Cuántas muestras debo capturar?**

**Respuesta:**
- Mínimo: 3 muestras por gesto
- Recomendado: 5-10 muestras
- Más es mejor para mejorar el modelo

---

### **2. ¿Mis datos son privados?**

**Respuesta:**
- Sí, solo se capturan **keypoints numéricos**
- No se graba video ni imágenes
- Los keypoints son coordenadas 3D anónimas
- Se suben a Google Drive con permisos restringidos

---

### **3. ¿Qué pasa si me equivoco al capturar?**

**Respuesta:**
- Hacer clic en "Reintentar" antes de guardar
- Las muestras incorrectas no afectan el modelo
- El admin las revisa antes de entrenar

---

### **4. ¿Cuándo se actualiza el modelo?**

**Respuesta:**
- El admin entrena el modelo periódicamente
- Las contribuciones se acumulan en Google Drive
- Cuando hay suficientes datos nuevos, se re-entrena
- El modelo se actualiza en el frontend

---

### **5. ¿Puedo ver mis contribuciones?**

**Respuesta:**
- Sí, en la página `/contribute` hay un contador
- Muestra total de muestras y gestos únicos
- Los datos se guardan en `localStorage` del navegador

---

### **6. ¿Qué navegador funciona mejor?**

**Respuesta:**
- **Mejor:** Chrome/Edge (Chromium)
- **Bueno:** Firefox
- **Aceptable:** Safari (macOS/iOS)
- **No soportado:** Internet Explorer

---

### **7. ¿Necesito entrenamiento especial?**

**Respuesta:**
- No, cualquiera puede contribuir
- Ver las imágenes del abecedario como referencia
- Hacer los gestos de manera natural
- El sistema aprende de la variabilidad

---

### **8. ¿Qué hago si el reconocimiento falla?**

**Respuesta:**
1. Verificar iluminación
2. Asegurar que las manos estén visibles
3. Hacer el gesto más lento
4. Mantenerlo 2-3 segundos
5. Probar con otro gesto

---

### **9. ¿Puedo contribuir en cualquier momento?**

**Respuesta:**
- Sí, 24/7 desde cualquier dispositivo
- Solo necesitas cámara y navegador
- Las contribuciones se sincronizan automáticamente

---

### **10. ¿Cómo sé que mi contribución fue exitosa?**

**Respuesta:**
```
✅ Muestra guardada: hola_1761533206242.json
📤 Subida a Drive: exitosa
```

Si ves estos mensajes, todo funcionó correctamente.

---

## 📊 Estadísticas de Contribución

### **Tu Progreso**

```
Objetivo: Capturar los 14 gestos
Progreso: X / 14 (XX%)

Total de muestras: XX
Gestos únicos: X
```

### **Recomendaciones**

| Gestos capturados | Acción recomendada |
|-------------------|--------------------|
| 0-4 | 🚀 ¡Empieza a contribuir! |
| 5-9 | 👍 Buen progreso, sigue así |
| 10-13 | 🎯 Casi completo, un poco más |
| 14 | 🎉 ¡Objetivo cumplido! Puedes agregar más muestras |

---

## 🔗 Recursos Adicionales

- [Arquitectura del Sistema](01_ARQUITECTURA_SISTEMA.md)
- [Guía de Configuración](02_GUIA_CONFIGURACION.md)
- [Backend - Entrenamiento](../../gesto_releasev1/docs/03_FLUJO_MIXTO.md)

---

**🎯 ¡Gracias por contribuir a hacer este sistema más inclusivo!**

