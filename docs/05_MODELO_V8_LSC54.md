# Modelo v8 (con LSC-54)

Documento **vigente** del modelo. Sustituye a las cifras de [04_MODELO_V7.md](04_MODELO_V7.md), que queda como
historial del modelo anterior (18 señas, solo datos propios). Donde `01`–`03` digan otra cosa, manda este.

Código de entrenamiento: repositorio `Tesis`, carpeta `gesto_releasev1/` (`scripts/extract_lsc54_features.py`,
`src/prepare_dataset.py`, `src/splits.py`, `src/train_v7.py`).

## Qué es

Un modelo de **57 señas** de la lengua de señas colombiana (más una clase de rechazo `sin-sena`), entrenado con:

| Fuente | Muestras | Señas | Personas |
|---|---|---|---|
| Datos propios (la app) | 1311 | 18 | sin identificar |
| **LSC-54** (Universidad de La Sabana) | 2784 | 54 (15 coinciden con las propias) | 34 |
| Negativos sintéticos | 240 | – | – |

Datos de LSC-54: Data in Brief vol. 63 (2025), doi 10.57760/sciencedb.25639. **Citarlo al usar el modelo.**
La licencia de redistribución no está confirmada, por eso el archivo de landmarks no se sube al repositorio.

## Resultados (con personas que el modelo nunca vio)

La prueba separa **por persona**: 5 señantes de LSC-54 (5, 9, 14, 19 y 31) quedan fuera del entrenamiento.
Es la medida que importa para saber si funciona con alguien nuevo.

| | Exactitud | IC 95% |
|---|---|---|
| Solo señas (602 muestras) | **81.2%** | 77.9 – 84.1 |
| Incluyendo `sin-sena` (638 muestras) | 77.3% | 73.9 – 80.4 |
| Señantes nuevos de LSC-54 | 75.7% | – |
| Tus señas originales (datos propios) | 91.8% | – |
| 5 repeticiones con otros señantes de prueba | 75.6% ± 4.0 (de 71.6% a 82.4%) | – |

Por categoría: saludos 91%, cortesía 83%, colores 82%, respuestas 77%, **números 54%**.

**La cifra depende de quién sea la persona** (de 71.6% a 82.4% según los señantes de prueba) y solo hay 5 por
prueba, así que los intervalos son anchos. Tus señas originales siguen en el mismo nivel que con el modelo anterior
(91.8% ahora frente a 89.9% antes, aunque con otra partición de capturas, así que no es una comparación exacta)
pese a pasar de 18 a 57 clases.

## Cómo decide la app

Acepta una seña solo si: la clase ganadora no es `sin-sena`, la confianza es ≥ **0.70** y la ventaja sobre la
segunda clase es ≥ **0.15**. Si no, pide repetir. Con personas nuevas:

| Umbral | Se aceptan | Aciertan entre las aceptadas | Piden repetir |
|---|---|---|---|
| 0.49 | 80% | 92.7% | 20% |
| 0.60 | 75% | 94.1% | 25% |
| **0.70 (elegido)** | **70%** | **96.2%** | **30%** |
| 0.80 | 64% | 98.4% | 36% |
| 0.91 | 51% | 98.7% | 49% |

Decir en voz alta una palabra equivocada cuesta más que pedir "repítela", pero rechazar la mitad de los intentos
haría la app frustrante. El umbral vive en `model_config.json`; se cambia reentrenando con `--threshold`.

## Lo que se descubrió al procesar los 2880 videos (y por qué el modelo es así)

1. **El zip de colores está grabado en vista espejo.** El 94% de sus videos dominaba con la mano izquierda con 17
   señantes distintos (imposible que todos sean zurdos). Espejándolo pasa a 95% derecha, y las personas que
   aparecen en varios zips quedan consistentes (100% derecha en Colors y Numbers). Courtesy y Numbers no se espejan.
2. **Las caras están pixeladas.** MediaPipe las detecta en ~2% de los frames (en tus datos, ~99%). Con cara, el modelo
   aprendería "sin cara = color o número" y fallaría en la app. Por eso el modelo **no usa la cara**
   (`preprocess.use_face = false` en `model_config.json`); el front lo lee y lo respeta.
3. **Un defecto del modelo anterior:** los negativos sintéticos de "temblor" tenían ceros "sucios" donde no hay
   mano o cara, un atajo trivial para reconocerlos. Corregido; por eso `sin-sena` ya no parece funcionar bien.
4. **Probado y descartado:** normalizar la forma de la mano por su tamaño empeoró el resultado (números de 54% a 39%).
5. **No hace falta GPU:** el entrenamiento completo tarda ~75 s en CPU.

## Limitaciones conocidas

- **Números (54%):** las confusiones típicas son seis→uno, nueve→tres, cinco→otras. Son configuraciones de dedos
  finas; con 15 frames y los landmarks actuales cuesta distinguirlas. Es la mejora de mayor valor pendiente.
- **Colores parecidos:** negro→rosado y naranja→rojo. Son señas que tocan la cara y la cara no se usa.
- **`sin-sena` es débil** (rechaza 42% de los negativos sintéticos): hacen falta negativos reales. La página de
  contribuir ya tiene la opción "No es una seña" para grabarlos.
- **Dominio de grabación distinto:** los videos de LSC-54 tienen fondo blanco, bata blanca y cámara fija; la app se
  usa con cámaras y entornos variados. Probar con cámara real y personas distintas es lo siguiente.
- **Lateralidad:** unos pocos señantes (S29–S32) dominan con la mano izquierda en todas sus sesiones; pueden ser
  zurdos o estar espejados. El entrenamiento espeja el 25% de las muestras, lo que cubre en parte a los zurdos.
- **`chao` y `adiós` se mantienen como señas separadas** hasta que alguien de la comunidad sorda confirme si son
  la misma. Lo mismo vale para cualquier seña de LSC-54 con el mismo nombre que una propia: se unieron solo las que
  coinciden por nombre o por alias (`models/lsc54_aliases.json`), sin verificar que sean idénticas.

## Cómo reentrenar

```powershell
# En Tesis/gesto_releasev1 (ver scripts/README_LSC54.md para generar assets/external/lsc54_features.npz)
python src\prepare_dataset.py --add-missing-vocabulary
python src\train_v7.py --threshold 0.70 --cv 5

# En este repo
Copy-Item ..\Tesis\gesto_releasev1\models\v8\* public\models\ -Include model.json,weights.bin,words.json,model_config.json
npm test
```

Si cambias el preprocesamiento, cámbialo en `preprocess.py` **y** en `preprocess.js`, regenera
`tests/fixtures/preprocess_parity.json` con `tests/make_parity_fixture.py` y comprueba que ambos lados pasen.

## Qué mejora más (en orden)

1. **Negativos reales** y **más personas propias** (cada muestra de la página de contribuir ya guarda un
   identificador anónimo): permiten medir y mejorar con tu entorno real.
2. **Números:** más datos o características de dedos más finas.
3. **Revisar el vocabulario con la comunidad sorda** (equivalencias, variantes regionales).
