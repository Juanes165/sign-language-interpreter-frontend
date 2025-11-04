import { render } from '@testing-library/react';
import {
  HandIcon,
  HandsIcon,
  LetterIcon,
  BookIcon,
  PlayIcon,
  QuestionIcon,
  CameraIcon,
  AppLogo,
  LandmarksLogo,
  LandmarksPointsLogo,
  SunIcon,
  MoonIcon,
  DeleteIcon,
} from '../icons';

describe('Iconos', () => {
  describe('HandIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<HandIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('debe aceptar props adicionales', () => {
      const { container } = render(<HandIcon className="test-class" data-testid="hand-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('test-class');
      expect(svg).toHaveAttribute('data-testid', 'hand-icon');
    });
  });

  describe('HandsIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<HandsIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('debe aceptar props adicionales', () => {
      const { container } = render(<HandsIcon className="test-class" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('test-class');
    });
  });

  describe('LetterIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<LetterIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('BookIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<BookIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('PlayIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<PlayIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('QuestionIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<QuestionIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('CameraIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<CameraIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('AppLogo', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<AppLogo />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 170.675 108.926');
    });
  });

  describe('LandmarksLogo', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<LandmarksLogo />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('LandmarksPointsLogo', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<LandmarksPointsLogo />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('SunIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<SunIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('MoonIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<MoonIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('DeleteIcon', () => {
    it('debe renderizar correctamente', () => {
      const { container } = render(<DeleteIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Todos los iconos', () => {
    const icons = [
      { name: 'HandIcon', component: HandIcon },
      { name: 'HandsIcon', component: HandsIcon },
      { name: 'LetterIcon', component: LetterIcon },
      { name: 'BookIcon', component: BookIcon },
      { name: 'PlayIcon', component: PlayIcon },
      { name: 'QuestionIcon', component: QuestionIcon },
      { name: 'CameraIcon', component: CameraIcon },
      { name: 'AppLogo', component: AppLogo },
      { name: 'LandmarksLogo', component: LandmarksLogo },
      { name: 'LandmarksPointsLogo', component: LandmarksPointsLogo },
      { name: 'SunIcon', component: SunIcon },
      { name: 'MoonIcon', component: MoonIcon },
      { name: 'DeleteIcon', component: DeleteIcon },
    ];

    icons.forEach(({ name, component: Icon }) => {
      it(`${name} debe aceptar y propagar props`, () => {
        const { container } = render(
          <Icon 
            className="custom-class" 
            style={{ color: 'red' }}
            data-testid={`${name.toLowerCase()}-test`}
          />
        );
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('custom-class');
        expect(svg).toHaveStyle({ color: 'red' });
        expect(svg).toHaveAttribute('data-testid', `${name.toLowerCase()}-test`);
      });
    });
  });
});

