import { render, screen, fireEvent } from '@testing-library/react';
import NumberInput from '../NumberInput';

describe('NumberInput', () => {
  it('debe renderizar con el valor inicial por defecto', () => {
    render(<NumberInput />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(2);
  });

  it('debe renderizar con el valor inicial personalizado', () => {
    render(<NumberInput initialValue={3} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(3);
  });

  it('debe tener los atributos min, max y step correctos', () => {
    render(<NumberInput min={1} max={10} step={2} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '10');
    expect(input).toHaveAttribute('step', '2');
  });

  it('debe estar deshabilitado por defecto', () => {
    render(<NumberInput />);
    const input = screen.getByRole('spinbutton');
    expect(input).toBeDisabled();
  });

  it('debe incrementar el valor cuando se hace clic en el botón de incremento', () => {
    render(<NumberInput initialValue={2} />);
    const input = screen.getByRole('spinbutton');
    const incrementButton = screen.getAllByRole('button')[0];
    
    expect(input).toHaveValue(2);
    fireEvent.click(incrementButton);
    expect(input).toHaveValue(3);
  });

  it('debe decrementar el valor cuando se hace clic en el botón de decremento', () => {
    render(<NumberInput initialValue={3} />);
    const input = screen.getByRole('spinbutton');
    const decrementButton = screen.getAllByRole('button')[1];
    
    expect(input).toHaveValue(3);
    fireEvent.click(decrementButton);
    expect(input).toHaveValue(2);
  });

  it('debe respetar el límite máximo', () => {
    render(<NumberInput initialValue={4} max={4} />);
    const input = screen.getByRole('spinbutton');
    const incrementButton = screen.getAllByRole('button')[0];
    
    fireEvent.click(incrementButton);
    // stepUp() respeta el max, así que no debería pasar de 4
    expect(Number(input.value)).toBeLessThanOrEqual(4);
  });

  it('debe respetar el límite mínimo', () => {
    render(<NumberInput initialValue={2} min={2} />);
    const input = screen.getByRole('spinbutton');
    const decrementButton = screen.getAllByRole('button')[1];
    
    fireEvent.click(decrementButton);
    // stepDown() respeta el min, así que no debería pasar de 2
    expect(Number(input.value)).toBeGreaterThanOrEqual(2);
  });
});

