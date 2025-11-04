import { renderHook, act } from '@testing-library/react';
import { createRef } from 'react';
import useClickOutside from '../useClickOutside';

describe('useClickOutside', () => {
  let callbackFn;
  let container;

  beforeEach(() => {
    callbackFn = jest.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  it('debe retornar una referencia al nodo', () => {
    const { result } = renderHook(() => useClickOutside(callbackFn));
    
    expect(result.current).toBeDefined();
    expect(result.current).toHaveProperty('current');
  });

  it('debe llamar al callback cuando se hace clic fuera del elemento', () => {
    const { result } = renderHook(() => useClickOutside(callbackFn));
    
    // Asignar el contenedor a la referencia
    act(() => {
      result.current.current = container;
    });

    // Simular clic fuera del contenedor
    act(() => {
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      const clickEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      outsideElement.dispatchEvent(clickEvent);
      document.body.removeChild(outsideElement);
    });

    expect(callbackFn).toHaveBeenCalledTimes(1);
  });

  it('no debe llamar al callback cuando se hace clic dentro del elemento', () => {
    const { result } = renderHook(() => useClickOutside(callbackFn));
    
    const insideElement = document.createElement('div');
    container.appendChild(insideElement);
    
    act(() => {
      result.current.current = container;
    });

    act(() => {
      const clickEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      insideElement.dispatchEvent(clickEvent);
    });

    expect(callbackFn).not.toHaveBeenCalled();
  });

  it('debe limpiar el event listener cuando se desmonta', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useClickOutside(callbackFn));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('debe agregar el event listener cuando se monta', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    
    renderHook(() => useClickOutside(callbackFn));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });
});

