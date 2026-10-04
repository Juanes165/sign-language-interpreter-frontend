/**
 * Preprocesamiento de landmarks (v7). Debe producir los mismos numeros que
 * gesto_releasev1/src/preprocess.py; hay un test de paridad con fixtures
 * generados por Python (tests/preprocess.test.js).
 *
 * Entrada : frames crudos de MediaPipe Holistic con 1662 valores
 *           (pose 33x4, cara 468x3, mano izq 21x3, mano der 21x3). Ausente = ceros.
 * Salida  : frames de 195 valores relativos al cuerpo:
 *   [  0: 63] mano izquierda menos su muñeca, / ancho de hombros
 *   [ 63:126] mano derecha, igual
 *   [126:132] posicion de cada muñeca respecto al centro de hombros / ancho
 *   [132:159] pose superior (9 puntos) respecto al centro de hombros / ancho
 *   [159:192] cara reducida (11 puntos) respecto al centro de hombros / ancho
 *   [192:195] flags: mano izq presente, mano der presente, pose presente
 */

export const RAW_FEATURES = 1662;
export const N_FEATURES = 195;

const POSE_POINTS = 33;
const POSE_STRIDE = 4;
const FACE_OFFSET = 132;
const FACE_POINTS = 468;
const LH_OFFSET = FACE_OFFSET + FACE_POINTS * 3; // 1536
const RH_OFFSET = LH_OFFSET + 63; // 1599

const POSE_KEEP = [0, 11, 12, 13, 14, 15, 16, 23, 24];
const FACE_KEEP = [1, 10, 13, 14, 33, 61, 133, 152, 263, 291, 362];
const L_SHOULDER = 11;
const R_SHOULDER = 12;

const DEFAULT_CENTER = [0.5, 0.5, 0];
const DEFAULT_SCALE = 0.3;
const MIN_SCALE = 1e-3;

function anyNonZero(raw, start, end) {
  for (let i = start; i < end; i++) if (raw[i] !== 0) return true;
  return false;
}

function poseXYZ(raw, idx) {
  const o = idx * POSE_STRIDE;
  return [raw[o], raw[o + 1], raw[o + 2]];
}

/**
 * @param {ArrayLike<number>} raw Frame crudo (1662)
 * @param {{center:number[], scale:number}|null} anchor Ultimos hombros validos
 * @returns {{features: Float32Array, anchor: {center:number[], scale:number}|null}}
 */
export function preprocessFrame(raw, anchor = null) {
  const out = new Float32Array(N_FEATURES);

  const hasLh = anyNonZero(raw, LH_OFFSET, LH_OFFSET + 63);
  const hasRh = anyNonZero(raw, RH_OFFSET, RH_OFFSET + 63);
  const hasFace = anyNonZero(raw, FACE_OFFSET, FACE_OFFSET + FACE_POINTS * 3);
  const ls = poseXYZ(raw, L_SHOULDER);
  const rs = poseXYZ(raw, R_SHOULDER);
  let hasPose = ls.some((v) => v !== 0) && rs.some((v) => v !== 0);

  if (!(hasLh || hasRh || hasPose || hasFace)) return { features: out, anchor };

  let center;
  let scale;
  if (hasPose) {
    center = [(ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2, (ls[2] + rs[2]) / 2];
    scale = Math.hypot(ls[0] - rs[0], ls[1] - rs[1]);
    if (scale < MIN_SCALE) hasPose = false;
    else anchor = { center, scale };
  }
  if (!hasPose) {
    ({ center, scale } = anchor ?? { center: DEFAULT_CENTER, scale: DEFAULT_SCALE });
  }

  const rel = (x, y, z, dst) => {
    out[dst] = (x - center[0]) / scale;
    out[dst + 1] = (y - center[1]) / scale;
    out[dst + 2] = (z - center[2]) / scale;
  };

  [[LH_OFFSET, hasLh], [RH_OFFSET, hasRh]].forEach(([base, present], slot) => {
    if (!present) return;
    const wx = raw[base];
    const wy = raw[base + 1];
    const wz = raw[base + 2];
    for (let p = 0; p < 21; p++) {
      const o = base + p * 3;
      const d = slot * 63 + p * 3;
      out[d] = (raw[o] - wx) / scale;
      out[d + 1] = (raw[o + 1] - wy) / scale;
      out[d + 2] = (raw[o + 2] - wz) / scale;
    }
    rel(wx, wy, wz, 126 + slot * 3);
  });

  if (hasPose) {
    POSE_KEEP.forEach((idx, k) => {
      const [x, y, z] = poseXYZ(raw, idx);
      rel(x, y, z, 132 + k * 3);
    });
  }
  if (hasFace) {
    FACE_KEEP.forEach((idx, k) => {
      const o = FACE_OFFSET + idx * 3;
      rel(raw[o], raw[o + 1], raw[o + 2], 159 + k * 3);
    });
  }

  out[192] = hasLh ? 1 : 0;
  out[193] = hasRh ? 1 : 0;
  out[194] = hasPose ? 1 : 0;
  return { features: out, anchor };
}

/** (T x 1662) -> (T x 195). Los hombros ausentes usan los ultimos validos de la secuencia. */
export function preprocessSequence(rawFrames) {
  let anchor = null;
  return rawFrames.map((raw) => {
    const res = preprocessFrame(raw, anchor);
    anchor = res.anchor;
    return res.features;
  });
}

/**
 * Remuestrea a `target` frames (misma regla que resample_sequence en Python):
 *  - T > target: indices floor(linspace(0, T-1, target))
 *  - T < target: interpolacion lineal sobre linspace(0, T-1, target)
 */
export function resampleSequence(frames, target) {
  const t = frames.length;
  if (t === target) return frames;
  if (t === 1) return Array.from({ length: target }, () => frames[0]);

  const out = [];
  for (let i = 0; i < target; i++) {
    const pos = (i * (t - 1)) / (target - 1);
    if (t > target) {
      out.push(frames[Math.floor(pos)]);
      continue;
    }
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, t - 1);
    const w = pos - lo;
    if (w === 0 || lo === hi) {
      out.push(frames[lo]);
      continue;
    }
    const mixed = new Float32Array(frames[lo].length);
    for (let j = 0; j < mixed.length; j++) mixed[j] = frames[lo][j] * (1 - w) + frames[hi][j] * w;
    out.push(mixed);
  }
  return out;
}
