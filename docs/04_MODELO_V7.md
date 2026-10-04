# Modelo v7

Documento vigente del modelo de reconocimiento. Donde `01`–`03` digan otra cosa
(18 gestos con LSTM de 64 unidades, umbral 0.6, normalización z-score, etc.), manda este.

Código de entrenamiento: repositorio `Tesis`, carpeta `gesto_releasev1/` (`src/preprocess.py`,
`src/prepare_dataset.py`, `src/train_v7.py`, `src/export_tfjs.py`).

## Qué cambió respecto al modelo anterior

| Tema | Antes (v6) | Ahora (v7) |
|---|---|---|
| Entrada por frame | 1662 valores crudos (84% es cara) | 195 valores relativos al cuerpo |
| Posición/distancia a la cámara | Afectaba la predicción | Se normaliza por centro y ancho de hombros |
| Manos ausentes | Ceros ambiguos | Ceros + banderas de presencia |
| Clases | 14 palabras | 18 palabras + `sin-sena` |
| Umbral de confianza | 0.1 (casi todo pasaba) | 0.85, calibrado, más margen entre las 2 mejores |
| Split de evaluación | Aleatorio por muestra | Por captura (ver abajo) |
| Aumento de datos | Ninguno | Rotación, escala, traslación, ruido, espejo (zurdos), deformación temporal |
| Parámetros del modelo en el front | Hardcodeados | Leídos de `public/models/model_config.json` |

## Por qué la cifra anterior (97.9%) no era comparable

El conversor de datos triplica cada captura con offsets 0, 1 y 2. Con un split aleatorio por
muestra, copias casi idénticas de la misma captura caían en entrenamiento y en prueba. Al separar
por captura, el modelo v6 original baja a **76.8%** sobre el mismo conjunto de prueba.

## Preprocesamiento (`src/lib/preprocess.js`)

Debe producir los mismos números que `preprocess.py`. Lo comprueba `tests/preprocess.test.js`
contra fixtures generados por Python. Cada frame de 1662 valores crudos de MediaPipe Holistic
pasa a 195:

- Manos (63 + 63): cada mano menos su muñeca, dividida por el ancho de hombros.
- Posición de cada muñeca respecto al centro de hombros (6).
- Pose superior, 9 puntos (27) y cara reducida, 11 puntos (33), relativos al centro de hombros.
- Banderas: mano izquierda, mano derecha y pose presentes (3).
- Si los hombros faltan en un frame, se usan los últimos válidos de la secuencia.

El remuestreo a 15 frames se hace sobre los datos crudos, antes del preprocesamiento
(`resampleSequence`).

## Cómo decide el front (`src/lib/recognition.js`)

Se acepta una seña solo si: la clase ganadora no es `sin-sena`, la confianza es ≥ umbral
(`model_config.json`) y la diferencia con la segunda clase es ≥ margen (0.15). Si no, se muestra
un mensaje pidiendo repetir la seña. Una misma palabra no se repite dentro de 1.5 s.

## Métricas

Conjunto de prueba: 243 muestras (109 capturas únicas), semilla fija 42.

| | Accuracy | IC 95% (Wilson) | F1 macro |
|---|---|---|---|
| v7, solo las 18 palabras (207 muestras) | **89.9%** | 85.0 – 93.3 | – |
| v6 original, mismas 207 muestras | 76.8% | 70.6 – 82.0 | 0.758 |
| v7, incluyendo `sin-sena` (243 muestras) | 81.9% | 76.6 – 86.2 | 0.840 |
| v7, validación cruzada de 5 folds por captura | 80.5% ± 3.2 | – | – |

Con el umbral 0.85, el 66% de las muestras de palabras se aceptan y son correctas; el resto se
rechaza o se confunde.

### Limitaciones conocidas

- **Pocas capturas.** Hay unas 23–37 capturas únicas por seña, y 3–4 por seña en el conjunto de
  prueba, así que los intervalos son anchos.
- **`sin-sena` es débil.** Los negativos de entrenamiento son sintéticos (poses congeladas y
  transiciones armadas con tus mismas muestras). Solo se rechaza el 67% de ellos (F1 0.53). Lo
  correcto es recolectar negativos reales con la app: manos moviéndose sin hacer una seña.
- **Señas confundibles.** Las de peor F1 son `bien` (0.60), `mas-o-menos` (0.62), `con-gusto`
  (0.67), `lo-siento` (0.73) y `adios` (0.75).
- **Agrupación aproximada.** Los `.npy` no conservan qué muestras vienen de la misma captura;
  `prepare_dataset.py` lo infiere. Si hay JSON originales en `assets/web_contributions/`, los usa
  y los grupos son exactos.
- **Sin identificar señantes.** No hay `signer_id`, así que no se puede medir cuánto generaliza
  a una persona nueva. Es la medida que más importa para uso real.
- **Cámara real sin probar en este entorno.** El modelo se verifica en TF.js contra Keras
  (`tests/model.test.js`), pero MediaPipe carga desde un CDN y no pudo probarse con cámara real.

## Reentrenar y actualizar el modelo

```bash
# En Tesis/gesto_releasev1
python src/prepare_dataset.py
python src/train_v7.py --baseline --cv 5     # exporta a models/v7/ antes de las comparaciones

# En este repo
cp ../Tesis/gesto_releasev1/models/v7/{model.json,weights.bin,words.json,model_config.json} public/models/
npm test
```

Si cambias el preprocesamiento, cámbialo en `preprocess.py` **y** en `preprocess.js`, regenera
`tests/fixtures/preprocess_parity.json` con `tests/make_parity_fixture.py` y comprueba que los
dos lados pasen. Cambiar solo uno rompe el reconocimiento sin dar errores.

## Vocabulario único y contribuciones

- **Una sola fuente de verdad:** el texto a mostrar/leer y la categoría de cada seña viven en
  `Tesis/gesto_releasev1/models/vocabulary.json`. El entrenamiento los copia a
  `public/models/model_config.json` (`vocabulary` y `categories`) y el front los lee de ahí: voz,
  popup de señas (agrupado por categoría y con buscador) y página de contribuir. No hay listas
  duplicadas a mano. Para agregar una seña: añadirla en `vocabulary.json`, reentrenar (o regenerar la
  config con `python src/export_tfjs.py models/v7`) y copiar `model_config.json` aquí.
- **`contributorId`:** cada muestra grabada en la página de contribuir incluye un identificador
  aleatorio guardado solo en el navegador (sin datos personales). Permite entrenar y evaluar
  separando a las personas, que es la medida que importa para saber si el modelo funciona con
  alguien nuevo.
- **"No es una seña":** la página de contribuir permite grabar movimientos reales sin seña (clase
  `sin-sena`). Son los mejores negativos para que el modelo rechace en vez de inventar una palabra;
  sustituyen a los sintéticos del entrenamiento actual.

## Cómo mejorarlo más

1. Recolectar más capturas por seña y de más personas (ya se guarda un identificador por persona).
2. Recolectar negativos reales para `sin-sena` (ya hay una opción en la página de contribuir).
3. Bajar de Drive los JSON originales (frames sin remuestrear): permitirían usar más de 15 frames.
4. Sumar señas de datasets públicos de LSC (p. ej. LSC54, con landmarks de MediaPipe).
