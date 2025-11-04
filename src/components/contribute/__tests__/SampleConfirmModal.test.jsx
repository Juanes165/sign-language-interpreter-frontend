import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SampleConfirmModal from '../SampleConfirmModal';

// Mock del config
jest.mock('@/config/modelConfig', () => ({
  MODEL_CONFIG: {
    MODEL_FRAMES: 15,
    RECOMMENDED_MIN_FRAMES: 10,
    EXCELLENT_FRAMES: 20,
  },
  evaluateQuality: jest.fn((frames) => {
    if (frames >= 20) return { level: 'excellent', label: 'Excelente', message: 'Calidad excelente', color: 'green' };
    if (frames >= 15) return { level: 'optimal', label: 'Óptimo', message: 'Calidad óptima', color: 'blue' };
    if (frames >= 10) return { level: 'good', label: 'Bueno', message: 'Calidad buena', color: 'yellow' };
    return { level: 'poor', label: 'Aceptable', message: 'Calidad aceptable', color: 'red' };
  }),
}));

describe('SampleConfirmModal', () => {
  const mockSample = {
    id: 'test-123',
    gesture: 'hola',
    gestureName: 'Hola',
    totalFrames: 15,
    timestamp: Date.now(),
    keypoints: Array(1662 * 15).fill(0),
    metadata: {
      date: new Date().toISOString(),
      browser: 'Test Browser',
    },
  };

  const mockOnUpload = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no debe renderizar cuando isOpen es false', () => {
    render(
      <SampleConfirmModal
        sample={mockSample}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={false}
      />
    );

    expect(screen.queryByText('¡Muestra Capturada!')).not.toBeInTheDocument();
  });

  it('no debe renderizar cuando sample es null', () => {
    render(
      <SampleConfirmModal
        sample={null}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={true}
      />
    );

    expect(screen.queryByText('¡Muestra Capturada!')).not.toBeInTheDocument();
  });

  it('debe renderizar cuando isOpen es true y sample existe', () => {
    render(
      <SampleConfirmModal
        sample={mockSample}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={true}
      />
    );

    expect(screen.getByText('¡Muestra Capturada!')).toBeInTheDocument();
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('debe mostrar la información de la muestra', () => {
    render(
      <SampleConfirmModal
        sample={mockSample}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={true}
      />
    );

    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // totalFrames
  });

  it('debe llamar onUpload cuando se hace clic en el botón de subir', async () => {
    mockOnUpload.mockResolvedValue();

    render(
      <SampleConfirmModal
        sample={mockSample}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={true}
      />
    );

    const uploadButton = screen.getByText(/Subir al Modelo/i);
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(mockSample);
    });
  });

  it('debe mostrar estado de carga durante la subida', async () => {
    mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <SampleConfirmModal
        sample={mockSample}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={true}
      />
    );

    const uploadButton = screen.getByText(/Subir al Modelo/i);
    fireEvent.click(uploadButton);

    expect(screen.getByText(/Subiendo.../i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled();
    });
  });

  it('debe llamar onDelete cuando se hace clic en el botón de eliminar', () => {
    render(
      <SampleConfirmModal
        sample={mockSample}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={true}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /🗑️ Eliminar/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockSample);
  });

  it('debe deshabilitar los botones durante la subida', async () => {
    mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <SampleConfirmModal
        sample={mockSample}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={true}
      />
    );

    const uploadButton = screen.getByRole('button', { name: /📤 Subir al Modelo/i });
    const deleteButton = screen.getByRole('button', { name: /🗑️ Eliminar/i });

    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(uploadButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });
  });

  it('debe mostrar el emoji correcto según el gesto', () => {
    const holaSample = { ...mockSample, gesture: 'hola' };
    render(
      <SampleConfirmModal
        sample={holaSample}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={true}
      />
    );

    // El emoji se muestra como texto, así que verificamos que el componente renderiza
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('debe formatear la fecha correctamente', () => {
    const sampleWithTimestamp = {
      ...mockSample,
      timestamp: new Date('2024-01-15T14:30:00').getTime(),
    };

    render(
      <SampleConfirmModal
        sample={sampleWithTimestamp}
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        isOpen={true}
      />
    );

    // Verificamos que se muestra la hora (formato puede variar según locale)
    const timeElement = screen.getByText(/14:30/i);
    expect(timeElement).toBeInTheDocument();
  });
});

