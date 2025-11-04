import getVideoConstraints from '../getVideoConstraints';

describe('getVideoConstraints', () => {
  let originalInnerWidth;

  beforeEach(() => {
    // Guardar el valor original
    originalInnerWidth = window.innerWidth;
    // Mock de window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  afterEach(() => {
    // Restaurar el valor original
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('debe retornar constraints para pantallas grandes (>= 1280px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });

    const constraints = getVideoConstraints();

    expect(constraints).toEqual({
      width: 1280,
      height: 720,
    });
  });

  it('debe retornar constraints para pantallas muy grandes (> 1280px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    const constraints = getVideoConstraints();

    expect(constraints).toEqual({
      width: 1280,
      height: 720,
    });
  });

  it('debe retornar un objeto vacío para pantallas pequeñas (< 1280px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const constraints = getVideoConstraints();

    expect(constraints).toEqual({});
  });

  it('debe retornar un objeto vacío para pantallas móviles', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const constraints = getVideoConstraints();

    expect(constraints).toEqual({});
  });

  it('debe retornar constraints exactamente en el límite de 1280px', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });

    const constraints = getVideoConstraints();

    expect(constraints).toEqual({
      width: 1280,
      height: 720,
    });
  });
});

