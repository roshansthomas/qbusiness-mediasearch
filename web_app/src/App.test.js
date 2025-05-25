import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock the aws-amplify configuration
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

// Mock window.aws_config
window.aws_config = {};

test('renders home page with Get Started button', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const buttonElement = screen.getByText(/Get Started/i);
  expect(buttonElement).toBeInTheDocument();
});
