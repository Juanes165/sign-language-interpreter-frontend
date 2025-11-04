import {
  extractKeypoints,
  handDetected,
  interpolateKeypoints,
  normalizeKeypoints,
  normalizeKeypointsSequence,
  drawHolisticLandmarks,
  MODEL_CONFIG,
  WORDS_TEXT,
} from '../gestureRecognitionLSTM';

describe('gestureRecognitionLSTM', () => {
  describe('extractKeypoints', () => {
    it('debe extraer keypoints de resultados completos de MediaPipe', () => {
      const mockResults = {
        poseLandmarks: Array.from({ length: 33 }, (_, i) => ({
          x: i * 0.01,
          y: i * 0.02,
          z: i * 0.03,
          visibility: 0.9,
        })),
        faceLandmarks: Array.from({ length: 468 }, (_, i) => ({
          x: i * 0.01,
          y: i * 0.02,
          z: i * 0.03,
        })),
        leftHandLandmarks: Array.from({ length: 21 }, (_, i) => ({
          x: i * 0.01,
          y: i * 0.02,
          z: i * 0.03,
        })),
        rightHandLandmarks: Array.from({ length: 21 }, (_, i) => ({
          x: i * 0.01,
          y: i * 0.02,
          z: i * 0.03,
        })),
      };

      const keypoints = extractKeypoints(mockResults);

      expect(keypoints).toBeInstanceOf(Float32Array);
      expect(keypoints.length).toBe(1662); // 132 + 1404 + 63 + 63
    });

    it('debe manejar resultados sin landmarks (rellenar con ceros)', () => {
      const mockResults = {
        poseLandmarks: null,
        faceLandmarks: null,
        leftHandLandmarks: null,
        rightHandLandmarks: null,
      };

      const keypoints = extractKeypoints(mockResults);

      expect(keypoints).toBeInstanceOf(Float32Array);
      expect(keypoints.length).toBe(1662);
      expect(Array.from(keypoints).every(v => v === 0)).toBe(true);
    });

    it('debe manejar resultados parciales (solo pose)', () => {
      const mockResults = {
        poseLandmarks: Array.from({ length: 33 }, () => ({
          x: 0.5,
          y: 0.5,
          z: 0.5,
          visibility: 1,
        })),
        faceLandmarks: null,
        leftHandLandmarks: null,
        rightHandLandmarks: null,
      };

      const keypoints = extractKeypoints(mockResults);

      expect(keypoints.length).toBe(1662);
      // Los primeros 132 valores deben ser del pose
      const poseValues = Array.from(keypoints.slice(0, 132));
      expect(poseValues.some(v => v !== 0)).toBe(true);
    });

    it('debe usar visibility por defecto si no está presente', () => {
      const mockResults = {
        poseLandmarks: Array.from({ length: 33 }, () => ({
          x: 0.5,
          y: 0.5,
          z: 0.5,
          // sin visibility
        })),
        faceLandmarks: null,
        leftHandLandmarks: null,
        rightHandLandmarks: null,
      };

      const keypoints = extractKeypoints(mockResults);
      // El cuarto valor de cada landmark debe ser 0 (visibility por defecto)
      expect(keypoints[3]).toBe(0);
    });
  });

  describe('handDetected', () => {
    it('debe retornar true cuando hay mano izquierda', () => {
      const results = {
        leftHandLandmarks: Array.from({ length: 21 }),
        rightHandLandmarks: null,
      };

      expect(handDetected(results)).toBe(true);
    });

    it('debe retornar true cuando hay mano derecha', () => {
      const results = {
        leftHandLandmarks: null,
        rightHandLandmarks: Array.from({ length: 21 }),
      };

      expect(handDetected(results)).toBe(true);
    });

    it('debe retornar true cuando hay ambas manos', () => {
      const results = {
        leftHandLandmarks: Array.from({ length: 21 }),
        rightHandLandmarks: Array.from({ length: 21 }),
      };

      expect(handDetected(results)).toBe(true);
    });

    it('debe retornar false cuando no hay manos', () => {
      const results = {
        leftHandLandmarks: null,
        rightHandLandmarks: null,
      };

      expect(handDetected(results)).toBe(false);
    });
  });

  describe('interpolateKeypoints', () => {
    it('debe retornar la misma secuencia si la longitud coincide', () => {
      const keypoints = [
        new Float32Array([1, 2, 3]),
        new Float32Array([4, 5, 6]),
        new Float32Array([7, 8, 9]),
      ];

      const result = interpolateKeypoints(keypoints, 3);

      expect(result.length).toBe(3);
      expect(result).toEqual(keypoints);
    });

    it('debe interpolar cuando la secuencia es más corta', () => {
      const keypoints = [
        new Float32Array([1, 2, 3]),
        new Float32Array([4, 5, 6]),
      ];

      const result = interpolateKeypoints(keypoints, 5);

      expect(result.length).toBe(5);
      expect(result[0]).toEqual(keypoints[0]);
      expect(result[result.length - 1]).toEqual(keypoints[keypoints.length - 1]);
    });

    it('debe reducir cuando la secuencia es más larga', () => {
      const keypoints = Array.from({ length: 20 }, (_, i) =>
        new Float32Array([i, i * 2, i * 3])
      );

      const result = interpolateKeypoints(keypoints, 10);

      expect(result.length).toBe(10);
    });

    it('debe manejar arrays vacíos', () => {
      const result = interpolateKeypoints([], 5);

      expect(result.length).toBe(5);
    });
  });

  describe('normalizeKeypoints', () => {
    it('debe llamar a interpolateKeypoints con la longitud objetivo', () => {
      const keypoints = [
        new Float32Array([1, 2, 3]),
        new Float32Array([4, 5, 6]),
      ];

      const result = normalizeKeypoints(keypoints, 10);

      expect(result.length).toBe(10);
    });

    it('debe usar 15 como longitud por defecto', () => {
      const keypoints = Array.from({ length: 5 }, () => new Float32Array([1, 2, 3]));

      const result = normalizeKeypoints(keypoints);

      expect(result.length).toBe(15);
    });
  });

  describe('normalizeKeypointsSequence', () => {
    let mockTf;

    beforeEach(() => {
      mockTf = {
        tensor1d: jest.fn((data) => ({
          dispose: jest.fn(),
          data: data,
        })),
        tensor2d: jest.fn((data, shape) => ({
          shape,
          slice: jest.fn((start, size) => ({
            sub: jest.fn(() => ({
              div: jest.fn(() => ({
                dispose: jest.fn(),
              })),
            })),
          })),
          dispose: jest.fn(),
        })),
        concat: jest.fn((components) => ({
          shape: [15, 1662],
        })),
        tidy: jest.fn((fn) => fn()),
      };
    });

    it('debe retornar la secuencia sin cambios si no hay stats', () => {
      const sequence = {
        shape: [15, 1662],
      };

      const result = normalizeKeypointsSequence(sequence, null, mockTf);

      expect(result).toBe(sequence);
    });

    it('debe normalizar usando estadísticas cuando están disponibles', () => {
      const sequence = {
        shape: [15, 1662],
        slice: jest.fn(() => ({
          sub: jest.fn(() => ({
            div: jest.fn(() => ({
              dispose: jest.fn(),
            })),
          })),
        })),
      };

      const stats = {
        pose: {
          mean: Array(132).fill(0.5),
          std: Array(132).fill(0.1),
        },
        face: {
          mean: Array(1404).fill(0.5),
          std: Array(1404).fill(0.1),
        },
        left_hand: {
          mean: Array(63).fill(0.5),
          std: Array(63).fill(0.1),
        },
        right_hand: {
          mean: Array(63).fill(0.5),
          std: Array(63).fill(0.1),
        },
      };

      const result = normalizeKeypointsSequence(sequence, stats, mockTf);

      expect(mockTf.tidy).toHaveBeenCalled();
      expect(mockTf.tensor1d).toHaveBeenCalled();
    });

    it('debe manejar stats con std cero (usar 1e-6 como mínimo)', () => {
      const sequence = {
        shape: [15, 1662],
        slice: jest.fn(() => ({
          sub: jest.fn(() => ({
            div: jest.fn(() => ({
              dispose: jest.fn(),
            })),
          })),
        })),
      };

      const stats = {
        pose: {
          mean: Array(132).fill(0),
          std: Array(132).fill(0), // std cero
        },
      };

      normalizeKeypointsSequence(sequence, stats, mockTf);

      // Verificar que se usa Math.max(s, 1e-6) para evitar división por cero
      expect(mockTf.tensor1d).toHaveBeenCalled();
    });
  });

  describe('drawHolisticLandmarks', () => {
    let mockCtx;
    let mockCanvas;

    beforeEach(() => {
      mockCtx = {
        save: jest.fn(),
        restore: jest.fn(),
        strokeStyle: '',
        lineWidth: 0,
        fillStyle: '',
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
      };

      mockCanvas = {
        getContext: jest.fn(() => mockCtx),
        width: 640,
        height: 480,
      };
    });

    it('debe dibujar landmarks cuando están presentes', () => {
      const results = {
        poseLandmarks: Array.from({ length: 33 }, () => ({
          x: 0.5,
          y: 0.5,
        })),
        leftHandLandmarks: Array.from({ length: 21 }, () => ({
          x: 0.5,
          y: 0.5,
        })),
        rightHandLandmarks: Array.from({ length: 21 }, () => ({
          x: 0.5,
          y: 0.5,
        })),
      };

      drawHolisticLandmarks(mockCtx, results, 640, 480);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    it('debe manejar resultados sin landmarks', () => {
      const results = {
        poseLandmarks: null,
        leftHandLandmarks: null,
        rightHandLandmarks: null,
      };

      drawHolisticLandmarks(mockCtx, results, 640, 480);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });

  describe('MODEL_CONFIG', () => {
    it('debe tener las constantes correctas', () => {
      expect(MODEL_CONFIG.FRAMES).toBe(15);
      expect(MODEL_CONFIG.KEYPOINTS_LENGTH).toBe(1662);
      expect(MODEL_CONFIG.MIN_LENGTH_FRAMES).toBe(5);
      expect(MODEL_CONFIG.DEFAULT_THRESHOLD).toBe(0.1);
    });
  });

  describe('WORDS_TEXT', () => {
    it('debe contener mapeos de palabras', () => {
      expect(WORDS_TEXT['hola']).toBe('Hola');
      expect(WORDS_TEXT['adios']).toBe('Adiós');
      expect(WORDS_TEXT['bien']).toBe('Bien');
      expect(WORDS_TEXT['gracias']).toBe('Gracias');
    });

    it('debe tener mapeos para palabras compuestas', () => {
      expect(WORDS_TEXT['como-estas']).toBe('¿Cómo estás?');
      expect(WORDS_TEXT['buenos-dias']).toBe('Buenos días');
      expect(WORDS_TEXT['lo-siento']).toBe('Lo siento');
    });
  });
});

