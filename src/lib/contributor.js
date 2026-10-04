/**
 * Identificador anonimo del contribuyente. Es un UUID aleatorio guardado solo en este
 * navegador: no contiene datos personales y permite separar a las personas al entrenar
 * (evaluar con alguien que el modelo nunca vio).
 */

const STORAGE_KEY = 'contributorId';

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Devuelve el id guardado o crea uno nuevo. Si el almacenamiento no esta disponible
 * (navegacion privada, bloqueado), devuelve un id valido solo para esta sesion.
 * @param {Storage|undefined} storage inyectable para pruebas
 */
export function getContributorId(storage) {
  let store = storage;
  try {
    store = store ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  } catch {
    store = undefined;
  }
  try {
    const existing = store?.getItem(STORAGE_KEY);
    if (existing) return existing;
    const created = randomId();
    store?.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}
