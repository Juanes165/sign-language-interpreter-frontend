# 🎯 Solución al Problema de Reconocimiento por Distancia

## Problema Original

El modelo de reconocimiento de señas tenía un bug donde:
- ✅ Detectaba correctamente cuando la persona estaba **cerca** a la cámara
- ❌ Detectaba **otra seña diferente** cuando la persona se alejaba, **a pesar de hacer el mismo gesto**

## Causa Raíz

Aunque MediaPipe devuelve coordenadas normalizadas (0-1), estas coordenadas **aún varían con la distancia** a la cámara:

- **Cerca**: Los landmarks están más separados → valores mayores
- **Lejos**: Los landmarks están más juntos → valores menores

El modelo entrenado con muestras de cierta distancia no generaliza a otras distancias porque los **valores absolutos** de las coordenadas cambian aunque el **patrón relativo** del gesto sea idéntico.

## Solución Implementada

### Normalización Geométrica

Se añadió una función que normaliza las coordenadas de las manos para hacerlas **invariantes a la distancia**:

1. **Centra respecto a la muñeca** (landmark 0)
2. **Normaliza por escala** usando la distancia promedio desde la muñeca

#### Ejemplo Conceptual

**Sin normalización**:
- Cerca: dedo índice en (0.5, 0.6, -0.1)
- Lejos: dedo índice en (0.3, 0.4, -0.05)
- ❌ Valores diferentes → modelo confundido

**Con normalización**:
- Cerca: dedo índice normalizado → (1.2, 1.5, -0.3)
- Lejos: dedo índice normalizado → (1.2, 1.5, -0.3)
- ✅ Mismos valores → modelo reconoce el mismo gesto

## Archivos Modificados

### Frontend (Next.js/React)

1. **`src/lib/gestureRecognitionLSTM.js`**
   - ✅ Función `normalizeHandGeometry()`
   - ✅ Aplicada en `extractKeypoints()` para inferencia

2. **`src/hooks/useContributeCapture.js`**
   - ✅ Función `normalizeHandGeometry()` duplicada
   - ✅ Aplicada en `extractKeypoints()` para capturas

### Backend (Python/Tesis)

3. **`gesto_releasev1/src/utility.py`**
   - ✅ Función `normalize_hand_geometry()`
   - ✅ Aplicada en `extract_keypoints()` para entrenamiento

4. **`gesto_releasev1/src/extract_keypoints.py`**
   - ✅ Fix de importación de pandas (innecesario)
   - ✅ Fix de codificación UTF-8 para Windows

## Próximos Pasos Requeridos

⚠️ **IMPORTANTE**: Los cambios requieren **reentrenar el modelo** porque alteran los valores de los keypoints.

### Para Reentrenar

```bash
# 1. Regenerar keypoints con normalización
cd gesto_releasev1
.\env\Scripts\Activate.ps1
python src/extract_keypoints.py

# 2. Entrenar modelo LSTM
node src/train_lstm_node_v6.js

# 3. Copiar modelo al frontend
npm run copy-to-nextjs
```

## Testing

Para verificar que la solución funciona:

1. Realizar el mismo gesto **cerca** de la cámara → debe reconocer
2. Realizar el mismo gesto **lejos** de la cámara → debe reconocer igual
3. Comparar nivel de confianza → debe ser similar

## Documentación Adicional

Ver detalles técnicos completos en:
- `gesto_releasev1/docs/NORMALIZACION_GEOMETRICA.md`

## Resumen de Cambios

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `frontend/src/lib/gestureRecognitionLSTM.js` | ✅ Normalización geométrica | Listo |
| `frontend/src/hooks/useContributeCapture.js` | ✅ Normalización geométrica | Listo |
| `backend/src/utility.py` | ✅ Normalización geométrica | Listo |
| `backend/src/extract_keypoints.py` | ✅ Fixes menores | Listo |
| Documentación | ✅ Creada | Listo |
| Modelo reentrenado | ⏳ Pendiente | Necesario |

## Beneficios Esperados

✅ **Robustez**: Funciona a cualquier distancia de la cámara  
✅ **Consistencia**: Mismas predicciones independientemente de la posición  
✅ **Precisión**: Mejor generalización a condiciones diversas  
✅ **Eficiencia**: Costo computacional mínimo adicional  

---

**Estado**: ✅ **Implementación completa**, ⏳ **Reentrenamiento pendiente**

