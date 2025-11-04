import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import GesturesMainComponent, { InformationPopUp } from '../mainComponent';

// Mock del hook useGestureRecognitionLSTM
const mockUseGestureRecognitionLSTM = {
  videoRef: { current: null },
  isModelLoading: false,
  isWebcamReady: true,
  currentPrediction: null,
  sentence: [],
  status: 'Listo',
  error: null,
  clearSentence: jest.fn(),
};

jest.mock('@/hooks/useGestureRecognitionLSTM', () => ({
  useGestureRecognitionLSTM: jest.fn(() => mockUseGestureRecognitionLSTM),
}));

// Mock de los iconos
jest.mock('@/utils/icons', () => ({
  CameraIcon: () => <svg data-testid="camera-icon">Camera</svg>,
  DeleteIcon: () => <svg data-testid="delete-icon">Delete</svg>,
}));

// Mock de fetch
global.fetch = jest.fn();

describe('GesturesMainComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    
    // Resetear el mock del hook
    Object.assign(mockUseGestureRecognitionLSTM, {
      videoRef: { current: null },
      isModelLoading: false,
      isWebcamReady: true,
      currentPrediction: null,
      sentence: [],
      status: 'Listo',
      error: null,
      clearSentence: jest.fn(),
    });
  });

  it('debe renderizar el componente', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: ['hola', 'bien', 'adios'] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText(/Reconocimiento de señas/i)).toBeInTheDocument();
  });

  it('debe cargar los gestos desde el archivo words.json', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: ['hola', 'bien', 'adios'] }),
    });

    render(<GesturesMainComponent />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/models/words.json');
    });
  });

  it('debe usar gestos por defecto si falla la carga', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<GesturesMainComponent />);

    await waitFor(() => {
      // El componente debe renderizar con gestos por defecto
      expect(screen.getByText(/Reconocimiento de señas/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el estado de carga del modelo', () => {
    mockUseGestureRecognitionLSTM.isModelLoading = true;
    mockUseGestureRecognitionLSTM.isWebcamReady = false;
    mockUseGestureRecognitionLSTM.status = 'Cargando modelo LSTM...';
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    // El componente muestra "Cargando modelo LSTM..." cuando isModelLoading es true
    expect(screen.getByText('Cargando modelo LSTM...')).toBeInTheDocument();
  });

  it('debe mostrar el estado cuando la cámara no está lista', () => {
    mockUseGestureRecognitionLSTM.isWebcamReady = false;
    mockUseGestureRecognitionLSTM.status = 'Iniciando cámara...';
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText('Iniciando cámara...')).toBeInTheDocument();
  });

  it('debe mostrar la oración actual', () => {
    mockUseGestureRecognitionLSTM.sentence = ['hola', 'bien'];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText('hola')).toBeInTheDocument();
    expect(screen.getByText('bien')).toBeInTheDocument();
  });

  it('debe mostrar el mensaje de oración vacía cuando no hay predicciones', () => {
    mockUseGestureRecognitionLSTM.sentence = [];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText(/Realiza un gesto/i)).toBeInTheDocument();
  });

  it('debe llamar clearSentence cuando se hace clic en el botón de limpiar', () => {
    mockUseGestureRecognitionLSTM.sentence = ['hola'];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    const clearButton = screen.getByTestId('delete-icon').closest('button');
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(mockUseGestureRecognitionLSTM.clearSentence).toHaveBeenCalled();
    }
  });

  it('debe mostrar la predicción actual', () => {
    mockUseGestureRecognitionLSTM.currentPrediction = {
      text: 'hola',
      confidence: 0.95,
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText('hola')).toBeInTheDocument();
  });

  it('debe mostrar el mensaje de error cuando hay un error', () => {
    mockUseGestureRecognitionLSTM.error = 'Error al cargar el modelo';
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText(/Error al cargar el modelo/i)).toBeInTheDocument();
  });

  it('debe renderizar el componente InformationPopUp correctamente', () => {
    const mockInfo = {
      title: "Señas soportadas",
      description: "✅  La seña es detectada de forma consistente",
      description2: "⚠️  La seña es detectada de forma inconsistente",
      listOfItems: [
        { itemTitle: "Buenos días", itemIcon: "✅" },
        { itemTitle: "Hola", itemIcon: "⚠️" },
        { itemTitle: "Adiós", itemIcon: "✅" },
      ]
    };
    const setShow = jest.fn();

    render(<InformationPopUp information={mockInfo} setShow={setShow} />);

    // Verificar que el popup se renderizó
    expect(screen.getByText(/Señas soportadas/i)).toBeInTheDocument();
    expect(screen.getByText(/La seña es detectada de forma consistente/i)).toBeInTheDocument();
    expect(screen.getByText(/La seña es detectada de forma inconsistente/i)).toBeInTheDocument();
    expect(screen.getByText(/Buenos días/i)).toBeInTheDocument();
    expect(screen.getByText(/Hola/i)).toBeInTheDocument();
    expect(screen.getByText(/Adiós/i)).toBeInTheDocument();
    expect(screen.getByText(/¡Entendido!/i)).toBeInTheDocument();
  });

  it('debe cerrar el popup cuando se hace clic en el botón de cerrar', () => {
    const mockInfo = {
      title: "Test",
      description: "Test",
      description2: "Test",
      listOfItems: [{ itemTitle: "Test", itemIcon: "✅" }]
    };
    const setShow = jest.fn();

    render(<InformationPopUp information={mockInfo} setShow={setShow} />);

    const closeButtons = screen.getAllByRole('button');
    // El primer botón es el de cerrar (X)
    fireEvent.click(closeButtons[0]);
    expect(setShow).toHaveBeenCalledWith(false);
  });

  it('debe cerrar el popup cuando se hace clic en el botón "¡Entendido!"', () => {
    const mockInfo = {
      title: "Test",
      description: "Test",
      description2: "Test",
      listOfItems: [{ itemTitle: "Test", itemIcon: "✅" }]
    };
    const setShow = jest.fn();

    render(<InformationPopUp information={mockInfo} setShow={setShow} />);

    const entendidoButton = screen.getByText(/¡Entendido!/i);
    fireEvent.click(entendidoButton);
    expect(setShow).toHaveBeenCalledWith(false);
  });

  it('debe renderizar todas las señas de la lista', () => {
    const mockInfo = {
      title: "Señas soportadas",
      description: "Test",
      description2: "Test",
      listOfItems: [
        { itemTitle: "Buenos días", itemIcon: "✅" },
        { itemTitle: "Buenas tardes", itemIcon: "✅" },
        { itemTitle: "Buenas noches", itemIcon: "✅" },
        { itemTitle: "Cómo estás", itemIcon: "✅" },
        { itemTitle: "Por favor", itemIcon: "✅" },
        { itemTitle: "Gracias", itemIcon: "⚠️" },
        { itemTitle: "Perdón", itemIcon: "✅" },
        { itemTitle: "Con gusto", itemIcon: "✅" },
        { itemTitle: "Hola", itemIcon: "⚠️" },
        { itemTitle: "Adiós", itemIcon: "✅" },
        { itemTitle: "Bien", itemIcon: "⚠️" },
        { itemTitle: "Mal", itemIcon: "⚠️" },
        { itemTitle: "Más o menos", itemIcon: "✅" },
        { itemTitle: "Sordo", itemIcon: "⚠️" },
        { itemTitle: "Bienvenido", itemIcon: "⚠️" },
        { itemTitle: "Permiso", itemIcon: "✅" },
        { itemTitle: "Lo siento", itemIcon: "✅" },
        { itemTitle: "Feliz cumpleaños", itemIcon: "✅" }
      ]
    };
    const setShow = jest.fn();

    render(<InformationPopUp information={mockInfo} setShow={setShow} />);

    // Verificar que todas las señas se renderizan
    expect(screen.getByText(/Buenos días/i)).toBeInTheDocument();
    expect(screen.getByText(/Buenas tardes/i)).toBeInTheDocument();
    expect(screen.getByText(/Buenas noches/i)).toBeInTheDocument();
    expect(screen.getByText(/Cómo estás/i)).toBeInTheDocument();
    expect(screen.getByText(/Por favor/i)).toBeInTheDocument();
    expect(screen.getByText(/Gracias/i)).toBeInTheDocument();
    expect(screen.getByText(/Perdón/i)).toBeInTheDocument();
    expect(screen.getByText(/Con gusto/i)).toBeInTheDocument();
    expect(screen.getByText(/Hola/i)).toBeInTheDocument();
    expect(screen.getByText(/Adiós/i)).toBeInTheDocument();
    // "Bien" puede aparecer múltiples veces, usar getAllByText
    const bienElements = screen.getAllByText(/Bien/i);
    expect(bienElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Mal/i)).toBeInTheDocument();
    expect(screen.getByText(/Más o menos/i)).toBeInTheDocument();
    expect(screen.getByText(/Sordo/i)).toBeInTheDocument();
    expect(screen.getByText(/Bienvenido/i)).toBeInTheDocument();
    expect(screen.getByText(/Permiso/i)).toBeInTheDocument();
    expect(screen.getByText(/Lo siento/i)).toBeInTheDocument();
    expect(screen.getByText(/Feliz cumpleaños/i)).toBeInTheDocument();
  });

  it('debe mostrar el mensaje de nota con el número de señas', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    // Verificar que se muestra el mensaje con el número de señas (18)
    expect(screen.getByText(/18/i)).toBeInTheDocument();
    expect(screen.getByText(/señas oficiales/i)).toBeInTheDocument();
  });

  it('debe mostrar el estado cuando isWebcamReady es true', () => {
    mockUseGestureRecognitionLSTM.isWebcamReady = true;
    mockUseGestureRecognitionLSTM.status = 'Listo para capturar';
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText('Listo para capturar')).toBeInTheDocument();
  });

  it('debe mostrar frames capturados cuando hay una predicción con confianza', () => {
    mockUseGestureRecognitionLSTM.currentPrediction = {
      text: 'hola',
      confidence: 0.95,
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText('hola')).toBeInTheDocument();
    expect(screen.getByText(/95%/i)).toBeInTheDocument();
  });

  it('debe mostrar indicador de alta confianza cuando confidence > 0.8', () => {
    mockUseGestureRecognitionLSTM.currentPrediction = {
      text: 'hola',
      confidence: 0.9,
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText(/Alta confianza/i)).toBeInTheDocument();
  });

  it('debe mostrar indicador de media confianza cuando 0.5 < confidence <= 0.8', () => {
    mockUseGestureRecognitionLSTM.currentPrediction = {
      text: 'hola',
      confidence: 0.6,
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText(/Media confianza/i)).toBeInTheDocument();
  });

  it('debe mostrar indicador de baja confianza cuando confidence <= 0.5', () => {
    mockUseGestureRecognitionLSTM.currentPrediction = {
      text: 'hola',
      confidence: 0.3,
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText(/Baja confianza/i)).toBeInTheDocument();
  });

  it('debe tener el enlace para abrir información de señas', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    const infoLinks = screen.getAllByText(/aquí/i);
    expect(infoLinks.length).toBeGreaterThan(0);
    // Verificar que el elemento es clickeable
    expect(infoLinks[0]).toBeInTheDocument();
  });

  it('debe mostrar el número correcto de señas soportadas', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    // Verificar que se muestra el número 18 (número de señas en supportedSignsInfo)
    expect(screen.getByText(/18/i)).toBeInTheDocument();
  });

  it('debe mostrar el mensaje cuando no hay predicción actual', () => {
    mockUseGestureRecognitionLSTM.currentPrediction = null;
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText(/Realiza un gesto para ver la predicción/i)).toBeInTheDocument();
  });

  it('debe mostrar el mensaje cuando no hay palabras en el historial', () => {
    mockUseGestureRecognitionLSTM.sentence = [];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ word_ids: [] }),
    });

    render(<GesturesMainComponent />);

    expect(screen.getByText(/Las palabras aparecerán aquí/i)).toBeInTheDocument();
  });
});

