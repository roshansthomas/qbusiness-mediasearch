import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock the Routes component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }) => element,
}));

// Mock the Home component
jest.mock('./routes/home', () => () => <div data-testid="home-component">Home Component</div>);

// Mock the Playground component
jest.mock('./routes/playground', () => () => <div data-testid="playground-component">Playground Component</div>);

test('renders routes correctly', () => {
  const { getByTestId } = render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  
  expect(getByTestId('routes')).toBeInTheDocument();
  expect(getByTestId('home-component')).toBeInTheDocument();
});
