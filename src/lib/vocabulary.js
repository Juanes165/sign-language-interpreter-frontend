/**
 * Utilidades del vocabulario. La fuente unica es models/vocabulary.json (repo Tesis), que el
 * entrenamiento copia a public/models/model_config.json. El front no mantiene listas propias.
 */

/** Texto de respaldo si una clase no estuviera en el vocabulario: "buenos-dias" -> "Buenos dias". */
export function fallbackLabel(id) {
  const text = id.replace(/-/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Texto a mostrar y leer en voz alta para una clase. */
export function displayText(config, id) {
  return config?.vocabulary?.[id]?.display ?? fallbackLabel(id);
}

/** Texto sin signos de interrogacion/exclamacion, para listas y botones. */
export function plainLabel(config, id) {
  return displayText(config, id).replace(/[¿?¡!]/g, '');
}

/**
 * Agrupa las señas por categoria, respetando el orden de las categorias del config y
 * ordenando alfabeticamente dentro de cada una. Las categorias vacias se omiten.
 * @returns {{key:string, label:string, items:{id:string, display:string, label:string}[]}[]}
 */
export function groupByCategory(config) {
  const vocabulary = config?.vocabulary ?? {};
  const categories = config?.categories ?? {};
  const order = Object.keys(categories);
  const unknown = [...new Set(Object.values(vocabulary).map((v) => v.category))].filter((c) => !order.includes(c));

  return [...order, ...unknown]
    .map((key) => ({
      key,
      label: categories[key] ?? fallbackLabel(key),
      items: Object.entries(vocabulary)
        .filter(([, v]) => v.category === key)
        .map(([id, v]) => ({ id, display: v.display, label: plainLabel(config, id) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    }))
    .filter((group) => group.items.length > 0);
}

/** Cantidad de señas reconocibles (sin contar la clase de rechazo). */
export function vocabularySize(config) {
  return Object.keys(config?.vocabulary ?? {}).length;
}
