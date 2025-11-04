import { render, screen, fireEvent } from '@testing-library/react';
import DeployableMenu, { DeployableMenuItem } from '../DeployableMenu';

// Mock del hook useClickOutside
jest.mock('@/hooks/useClickOutside', () => {
  return jest.fn(() => ({
    current: null
  }));
});

describe('DeployableMenu', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('debe renderizar el trigger', () => {
    const trigger = <button>Menú</button>;
    render(<DeployableMenu trigger={trigger}>Contenido</DeployableMenu>);
    
    expect(screen.getByText('Menú')).toBeInTheDocument();
  });

  it('no debe mostrar el menú inicialmente', () => {
    const trigger = <button>Menú</button>;
    render(
      <DeployableMenu trigger={trigger}>
        <DeployableMenuItem>Opción 1</DeployableMenuItem>
      </DeployableMenu>
    );
    
    expect(screen.queryByText('Opción 1')).not.toBeInTheDocument();
  });

  it('debe mostrar el menú cuando se hace clic en el trigger', () => {
    const trigger = <button>Menú</button>;
    render(
      <DeployableMenu trigger={trigger}>
        <DeployableMenuItem>Opción 1</DeployableMenuItem>
      </DeployableMenu>
    );
    
    const triggerButton = screen.getByText('Menú');
    fireEvent.click(triggerButton);
    
    expect(screen.getByText('Opción 1')).toBeInTheDocument();
  });

  it('debe ocultar el menú cuando se hace clic nuevamente', () => {
    const trigger = <button>Menú</button>;
    render(
      <DeployableMenu trigger={trigger}>
        <DeployableMenuItem>Opción 1</DeployableMenuItem>
      </DeployableMenu>
    );
    
    const triggerButton = screen.getByText('Menú');
    
    // Abrir menú
    fireEvent.click(triggerButton);
    expect(screen.getByText('Opción 1')).toBeInTheDocument();
    
    // Cerrar menú
    fireEvent.click(triggerButton);
    expect(screen.queryByText('Opción 1')).not.toBeInTheDocument();
  });

  it('debe renderizar múltiples items del menú', () => {
    const trigger = <button>Menú</button>;
    render(
      <DeployableMenu trigger={trigger}>
        <DeployableMenuItem>Opción 1</DeployableMenuItem>
        <DeployableMenuItem>Opción 2</DeployableMenuItem>
        <DeployableMenuItem>Opción 3</DeployableMenuItem>
      </DeployableMenu>
    );
    
    const triggerButton = screen.getByText('Menú');
    fireEvent.click(triggerButton);
    
    expect(screen.getByText('Opción 1')).toBeInTheDocument();
    expect(screen.getByText('Opción 2')).toBeInTheDocument();
    expect(screen.getByText('Opción 3')).toBeInTheDocument();
  });
});

describe('DeployableMenuItem', () => {
  it('debe renderizar el contenido del item', () => {
    render(
      <DeployableMenuItem>
        <span>Contenido del item</span>
      </DeployableMenuItem>
    );
    
    expect(screen.getByText('Contenido del item')).toBeInTheDocument();
  });
});

