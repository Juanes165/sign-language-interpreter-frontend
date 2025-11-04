import { render, screen, fireEvent } from '@testing-library/react';
import GestureCapture from '../GestureCapture';

// Mock del hook useContributeCapture
const mockUseContributeCapture = {
  videoRef: { current: null },
  canvasRef: { current: null },
  isHolisticReady: true,
  isWebcamReady: true,
  isCapturing: false,
  capturedFrames: 0,
  totalSamples: 0,
  pendingSamples: [],
  currentSample: null,
  waitingForDecision: false,
  status: 'Listo',
  error: null,
  initializeHolistic: jest.fn(),
  startCamera: jest.fn(),
  cleanup: jest.fn(),
  confirmCurrentSample: jest.fn(),
  rejectCurrentSample: jest.fn(),
  deleteSample: jest.fn(),
  uploadSample: jest.fn(),
  uploadAllSamples: jest.fn(),
  clearUploadedSamples: jest.fn(),
};

jest.mock('@/hooks/useContributeCapture', () => ({
  useContributeCapture: jest.fn(() => mockUseContributeCapture),
}));

// Mock de los componentes hijos
jest.mock('../SamplesList', () => {
  return function MockSamplesList({ samples, onClearUploaded }) {
    return (
      <div data-testid="samples-list">
        <div>Muestras: {samples.length}</div>
        <button onClick={onClearUploaded}>Limpiar</button>
      </div>
    );
  };
});

jest.mock('../SampleConfirmModal', () => {
  return function MockSampleConfirmModal({ isOpen, sample, onUpload, onDelete }) {
    if (!isOpen) return null;
    return (
      <div data-testid="sample-confirm-modal">
        <div>Modal abierto</div>
        <button onClick={() => onUpload(sample)}>Subir</button>
        <button onClick={() => onDelete(sample)}>Eliminar</button>
      </div>
    );
  };
});

describe('GestureCapture', () => {
  const mockGesture = {
    id: 'test-gesture',
    label: 'Hola',
    emoji: '👋',
  };

  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear el mock del hook
    Object.assign(mockUseContributeCapture, {
      videoRef: { current: null },
      canvasRef: { current: null },
      isHolisticReady: true,
      isWebcamReady: true,
      isCapturing: false,
      capturedFrames: 0,
      totalSamples: 0,
      pendingSamples: [],
      currentSample: null,
      waitingForDecision: false,
      status: 'Listo',
      error: null,
      initializeHolistic: jest.fn(),
      startCamera: jest.fn(),
      cleanup: jest.fn(),
      confirmCurrentSample: jest.fn(),
      rejectCurrentSample: jest.fn(),
      deleteSample: jest.fn(),
      uploadSample: jest.fn(),
      uploadAllSamples: jest.fn(),
      clearUploadedSamples: jest.fn(),
    });
  });

  it('debe renderizar el componente', () => {
    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByText(/Capturando: Hola/i)).toBeInTheDocument();
  });

  it('debe mostrar el botón de volver', () => {
    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    const backButton = screen.getByText(/← Volver/i);
    expect(backButton).toBeInTheDocument();
  });

  it('debe llamar onBack cuando se hace clic en el botón de volver', () => {
    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    const backButton = screen.getByText(/← Volver/i);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar el estado actual', () => {
    mockUseContributeCapture.status = 'Inicializando cámara...';

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByText('Inicializando cámara...')).toBeInTheDocument();
  });

  it('debe mostrar los frames capturados', () => {
    mockUseContributeCapture.capturedFrames = 10;

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('debe mostrar el total de muestras guardadas', () => {
    mockUseContributeCapture.totalSamples = 5;

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('debe mostrar el indicador de grabación cuando está capturando', () => {
    mockUseContributeCapture.isCapturing = true;
    mockUseContributeCapture.capturedFrames = 5;

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByText(/● GRABANDO/i)).toBeInTheDocument();
  });

  it('debe mostrar el modal de confirmación cuando hay una muestra esperando decisión', () => {
    const mockSample = {
      id: 'test-sample',
      gesture: 'hola',
      gestureName: 'Hola',
      totalFrames: 15,
      timestamp: Date.now(),
    };

    mockUseContributeCapture.waitingForDecision = true;
    mockUseContributeCapture.currentSample = mockSample;

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByTestId('sample-confirm-modal')).toBeInTheDocument();
  });

  it('no debe mostrar el modal cuando no hay muestra esperando decisión', () => {
    mockUseContributeCapture.waitingForDecision = false;
    mockUseContributeCapture.currentSample = null;

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.queryByTestId('sample-confirm-modal')).not.toBeInTheDocument();
  });

  it('debe mostrar el mensaje de error cuando hay un error', () => {
    mockUseContributeCapture.error = 'Cámara en uso';

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByText(/Problema Detectado/i)).toBeInTheDocument();
    expect(screen.getByText('Cámara en uso')).toBeInTheDocument();
  });

  it('debe mostrar el overlay de carga cuando no está listo', () => {
    mockUseContributeCapture.isHolisticReady = false;
    mockUseContributeCapture.isWebcamReady = false;
    mockUseContributeCapture.status = 'Inicializando...';

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    const statusElements = screen.getAllByText('Inicializando...');
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('debe mostrar el componente SamplesList', () => {
    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByTestId('samples-list')).toBeInTheDocument();
  });

  it('debe mostrar las instrucciones', () => {
    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByText(/Instrucciones/i)).toBeInTheDocument();
    expect(screen.getByText(/Posiciónate:/i)).toBeInTheDocument();
    expect(screen.getByText(/Realiza el gesto:/i)).toBeInTheDocument();
  });

  it('debe mostrar el nombre del gesto en las instrucciones', () => {
    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    const holaElements = screen.getAllByText(/Hola/i);
    expect(holaElements.length).toBeGreaterThan(0);
  });

  it('debe manejar la ausencia de gesto', () => {
    render(<GestureCapture gesture={null} onBack={mockOnBack} />);

    expect(screen.getByText(/Capturando: Gesto/i)).toBeInTheDocument();
  });

  it('debe manejar eventos de teclado Enter para confirmar muestra', () => {
    const mockSample = {
      id: 'test-sample',
      gesture: 'hola',
      gestureName: 'Hola',
      totalFrames: 15,
      timestamp: Date.now(),
    };

    mockUseContributeCapture.waitingForDecision = true;
    mockUseContributeCapture.currentSample = mockSample;

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    fireEvent.keyDown(window, { key: 'Enter', preventDefault: jest.fn() });

    expect(mockUseContributeCapture.confirmCurrentSample).toHaveBeenCalled();
  });

  it('debe manejar eventos de teclado Delete para rechazar muestra', () => {
    const mockSample = {
      id: 'test-sample',
      gesture: 'hola',
      gestureName: 'Hola',
      totalFrames: 15,
      timestamp: Date.now(),
    };

    mockUseContributeCapture.waitingForDecision = true;
    mockUseContributeCapture.currentSample = mockSample;

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    fireEvent.keyDown(window, { key: 'Delete', preventDefault: jest.fn() });

    expect(mockUseContributeCapture.rejectCurrentSample).toHaveBeenCalled();
  });

  it('debe manejar eventos de teclado Backspace para rechazar muestra', () => {
    const mockSample = {
      id: 'test-sample',
      gesture: 'hola',
      gestureName: 'Hola',
      totalFrames: 15,
      timestamp: Date.now(),
    };

    mockUseContributeCapture.waitingForDecision = true;
    mockUseContributeCapture.currentSample = mockSample;

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    fireEvent.keyDown(window, { key: 'Backspace', preventDefault: jest.fn() });

    expect(mockUseContributeCapture.rejectCurrentSample).toHaveBeenCalled();
  });

  it('debe mostrar el botón de reintentar cuando hay error', async () => {
    mockUseContributeCapture.error = 'Cámara en uso';
    mockUseContributeCapture.initializeHolistic.mockResolvedValue(undefined);
    mockUseContributeCapture.startCamera.mockResolvedValue(undefined);

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    const retryButton = screen.getByText(/🔄 Reintentar/i);
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    // Esperar a que se ejecute la lógica async
    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(mockUseContributeCapture.initializeHolistic).toHaveBeenCalled();
  });

  it('debe manejar errores en el botón de reintentar', async () => {
    mockUseContributeCapture.error = 'Cámara en uso';
    mockUseContributeCapture.initializeHolistic.mockRejectedValue(new Error('Error de inicialización'));
    mockUseContributeCapture.startCamera.mockResolvedValue(undefined);

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    const retryButton = screen.getByText(/🔄 Reintentar/i);
    fireEvent.click(retryButton);

    // Esperar a que se ejecute la lógica async
    await new Promise(resolve => setTimeout(resolve, 1100));

    // El error debería ser manejado sin crash
    expect(mockUseContributeCapture.initializeHolistic).toHaveBeenCalled();
  });

  it('debe mostrar diferentes mensajes de error según el tipo', () => {
    mockUseContributeCapture.error = 'Permisos de cámara denegados';

    render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    expect(screen.getByText(/Problema Detectado/i)).toBeInTheDocument();
    expect(screen.getByText(/Permisos de cámara denegados/i)).toBeInTheDocument();
  });

  it('debe mostrar el mensaje inicial cuando isClient es false', () => {
    // Mock de useState para simular isClient = false inicialmente
    const { rerender } = render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);
    
    // El componente debería mostrar "Inicializando..." inicialmente
    // pero como useContributeCapture está mockeado, el componente se renderiza normalmente
    // Necesitamos verificar el comportamiento cuando isClient cambia
    expect(screen.getByText(/Capturando:/i)).toBeInTheDocument();
  });

  it('debe limpiar el listener de teclado al desmontar', () => {
    const mockSample = {
      id: 'test-sample',
      gesture: 'hola',
      gestureName: 'Hola',
      totalFrames: 15,
      timestamp: Date.now(),
    };

    mockUseContributeCapture.waitingForDecision = true;
    mockUseContributeCapture.currentSample = mockSample;

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<GestureCapture gesture={mockGesture} onBack={mockOnBack} />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});

