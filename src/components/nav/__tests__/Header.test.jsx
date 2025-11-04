import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

// Mock de DeployableMenu
jest.mock('../DeployableMenu', () => {
  return {
    __esModule: true,
    default: ({ trigger, children }) => (
      <div data-testid="deployable-menu">
        {trigger}
        {children}
      </div>
    ),
    DeployableMenuItem: ({ children }) => <div>{children}</div>,
  };
});

// Mock de los iconos
jest.mock('@/utils/icons', () => ({
  AppLogo: () => <svg data-testid="app-logo">Logo</svg>,
  SunIcon: () => <svg data-testid="sun-icon">Sun</svg>,
  MoonIcon: () => <svg data-testid="moon-icon">Moon</svg>,
  HandsIcon: () => <svg data-testid="hands-icon">Hands</svg>,
  LetterIcon: () => <svg data-testid="letter-icon">Letter</svg>,
}));

describe('Header', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada prueba
    localStorage.clear();
    // Resetear el tema del documento
    document.documentElement.classList.remove('dark');
  });

  it('debe renderizar el logo', () => {
    render(<Header />);
    expect(screen.getByTestId('app-logo')).toBeInTheDocument();
  });

  it('debe renderizar el menú desplegable', () => {
    render(<Header />);
    expect(screen.getByTestId('deployable-menu')).toBeInTheDocument();
  });

  it('debe mostrar el modo oscuro cuando el tema actual es claro', () => {
    document.documentElement.classList.remove('dark');
    render(<Header />);
    
    // Buscar el botón de modo oscuro/claro
    const darkModeButton = screen.getByText('Modo oscuro');
    expect(darkModeButton).toBeInTheDocument();
  });

  it('debe cambiar el tema cuando se hace clic en el botón de modo oscuro', () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    
    render(<Header />);
    
    const darkModeButton = screen.getByText('Modo oscuro');
    fireEvent.click(darkModeButton);
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('debe mostrar el modo claro cuando el tema actual es oscuro', () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    
    render(<Header />);
    
    const lightModeButton = screen.getByText('Modo claro');
    expect(lightModeButton).toBeInTheDocument();
  });

  it('debe cambiar de tema oscuro a claro cuando se hace clic', () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    
    render(<Header />);
    
    const lightModeButton = screen.getByText('Modo claro');
    fireEvent.click(lightModeButton);
    
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('debe tener un enlace al inicio', () => {
    render(<Header />);
    const homeLink = screen.getByRole('link', { name: /logo/i }).closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });
});

