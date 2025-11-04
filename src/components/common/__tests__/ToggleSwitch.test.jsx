import { render, screen, fireEvent } from '@testing-library/react';
import ToggleSwitch from '../ToggleSwitch';

describe('ToggleSwitch', () => {
  it('debe renderizar correctamente', () => {
    const mockSetChecked = jest.fn();
    render(<ToggleSwitch checked={false} setChecked={mockSetChecked} />);
    
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked();
  });

  it('debe mostrar el estado checked cuando checked es true', () => {
    const mockSetChecked = jest.fn();
    render(<ToggleSwitch checked={true} setChecked={mockSetChecked} />);
    
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();
  });

  it('debe llamar setChecked cuando se hace clic', () => {
    const mockSetChecked = jest.fn();
    render(<ToggleSwitch checked={false} setChecked={mockSetChecked} />);
    
    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);
    
    expect(mockSetChecked).toHaveBeenCalledTimes(1);
    expect(mockSetChecked).toHaveBeenCalledWith(true);
  });

  it('debe cambiar el estado cuando se hace clic desde checked=true', () => {
    const mockSetChecked = jest.fn();
    render(<ToggleSwitch checked={true} setChecked={mockSetChecked} />);
    
    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);
    
    expect(mockSetChecked).toHaveBeenCalledTimes(1);
    expect(mockSetChecked).toHaveBeenCalledWith(false);
  });
});

