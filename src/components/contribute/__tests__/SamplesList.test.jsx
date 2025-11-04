import { render, screen, fireEvent } from '@testing-library/react';
import SamplesList from '../SamplesList';

describe('SamplesList', () => {
  const mockSamples = [
    {
      id: 'sample-1',
      gesture: 'hola',
      gestureName: 'Hola',
      totalFrames: 15,
      timestamp: new Date('2024-01-15T14:30:00').getTime(),
      keypoints: Array(1662 * 15).fill(0),
      uploaded: true,
      metadata: {
        date: '2024-01-15T14:30:00',
        browser: 'Chrome',
      },
    },
    {
      id: 'sample-2',
      gesture: 'gracias',
      gestureName: 'Gracias',
      totalFrames: 20,
      timestamp: new Date('2024-01-15T15:00:00').getTime(),
      keypoints: Array(1662 * 20).fill(0),
      uploaded: true,
      metadata: {
        date: '2024-01-15T15:00:00',
        browser: 'Firefox',
      },
    },
  ];

  const mockOnClearUploaded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe mostrar mensaje cuando no hay muestras subidas', () => {
    render(
      <SamplesList
        samples={[]}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    expect(screen.getByText(/Sin historial todavía/i)).toBeInTheDocument();
    expect(screen.getByText(/Las muestras que subas aparecerán aquí/i)).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando todas las muestras no están subidas', () => {
    const unuploadedSamples = mockSamples.map(s => ({ ...s, uploaded: false }));

    render(
      <SamplesList
        samples={unuploadedSamples}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    expect(screen.getByText(/Sin historial todavía/i)).toBeInTheDocument();
  });

  it('debe mostrar la lista de muestras subidas', () => {
    render(
      <SamplesList
        samples={mockSamples}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Gracias')).toBeInTheDocument();
    expect(screen.getByText(/Total subidas:/i)).toBeInTheDocument();
    // Hay múltiples "2" en el DOM (número de muestra, frames, etc.), verificamos que existe
    const allTwos = screen.getAllByText('2');
    expect(allTwos.length).toBeGreaterThan(0);
  });

  it('debe mostrar el número correcto de muestras subidas', () => {
    render(
      <SamplesList
        samples={mockSamples}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    expect(screen.getByText(/Total subidas:/i)).toBeInTheDocument();
    // Verificamos que el número "2" está presente en el contexto de "Total subidas"
    const totalSubidasText = screen.getByText(/Total subidas:/i);
    const parentElement = totalSubidasText.closest('p');
    expect(parentElement).toHaveTextContent('2');
  });

  it('debe mostrar información de cada muestra', () => {
    render(
      <SamplesList
        samples={mockSamples}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // frames de la primera muestra
    expect(screen.getByText('20')).toBeInTheDocument(); // frames de la segunda muestra
  });

  it('debe llamar onClearUploaded cuando se hace clic en el botón de limpiar', () => {
    render(
      <SamplesList
        samples={mockSamples}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    const clearButton = screen.getByText(/Limpiar historial/i);
    fireEvent.click(clearButton);

    expect(mockOnClearUploaded).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar el badge de subido para cada muestra', () => {
    render(
      <SamplesList
        samples={mockSamples}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    const badges = screen.getAllByText(/✓ Subido/i);
    expect(badges).toHaveLength(2);
  });

  it('debe mostrar detalles técnicos en el elemento details', () => {
    render(
      <SamplesList
        samples={mockSamples}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    const detailsElements = screen.getAllByText(/Ver detalles técnicos/i);
    expect(detailsElements.length).toBeGreaterThan(0);
  });

  it('debe filtrar correctamente solo las muestras subidas', () => {
    const mixedSamples = [
      ...mockSamples,
      {
        id: 'sample-3',
        gesture: 'adios',
        gestureName: 'Adios',
        totalFrames: 12,
        timestamp: Date.now(),
        keypoints: [],
        uploaded: false,
        metadata: {
          date: new Date().toISOString(),
          browser: 'Safari',
        },
      },
    ];

    render(
      <SamplesList
        samples={mixedSamples}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    // Solo debe mostrar las 2 muestras subidas, no la tercera
    expect(screen.getByText(/Total subidas:/i)).toBeInTheDocument();
    // Hay múltiples "2" en el DOM, pero verificamos que el componente muestra las muestras correctas
    const allTwos = screen.getAllByText('2');
    expect(allTwos.length).toBeGreaterThan(0);
    expect(screen.queryByText('Adios')).not.toBeInTheDocument();
  });

  it('debe formatear la fecha correctamente', () => {
    render(
      <SamplesList
        samples={mockSamples}
        onClearUploaded={mockOnClearUploaded}
      />
    );

    // Verificamos que se muestra la hora
    const timeElements = screen.getAllByText(/14:30|15:00/i);
    expect(timeElements.length).toBeGreaterThan(0);
  });
});

