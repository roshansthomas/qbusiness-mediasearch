import React from 'react';
import { render, screen } from '@testing-library/react';
import { components } from './authenticatorComponents';
import { useAuthenticator } from '@aws-amplify/ui-react';

// Mock the useAuthenticator hook
jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: jest.fn(),
  Heading: ({ level, padding, children }) => (
    <div data-testid={`heading-${level}`} style={{ padding }}>
      {children}
    </div>
  ),
  Text: ({ children }) => <div data-testid="text">{children}</div>,
  View: ({ children, padding, textAlign, backgroundColor }) => (
    <div
      data-testid="view"
      style={{ padding, textAlign, backgroundColor }}
    >
      {children}
    </div>
  ),
}));

describe('Authenticator Components', () => {
  describe('Header Component', () => {
    test('renders header with correct text', () => {
      const Header = components.Header;
      render(<Header />);
      
      expect(screen.getByTestId('heading-3')).toHaveTextContent('Amazon Q for Business');
    });
  });

  describe('Footer Component', () => {
    test('renders footer with copyright text', () => {
      const Footer = components.Footer;
      render(<Footer />);
      
      expect(screen.getByTestId('text')).toHaveTextContent('© Amazon Q for Business');
    });
  });

  describe('SignIn Components', () => {
    test('renders SignIn Header with welcome text', () => {
      const SignInHeader = components.SignIn.Header;
      render(<SignInHeader />);
      
      expect(screen.getByTestId('heading-3')).toHaveTextContent('Welcome to Amazon Q for Business');
    });

    test('renders SignIn Footer with sign in text', () => {
      const SignInFooter = components.SignIn.Footer;
      render(<SignInFooter />);
      
      expect(screen.getByTestId('text')).toHaveTextContent('Sign in to access Amazon Q for Business');
    });
  });

  describe('AuthenticatedRoute Components', () => {
    test('renders AuthenticatedRoute Header with username from user object', () => {
      // Mock the useAuthenticator hook to return a user
      useAuthenticator.mockReturnValue({
        user: { username: 'testuser' }
      });
      
      const AuthHeader = components.AuthenticatedRoute.Header;
      render(<AuthHeader />);
      
      expect(screen.getByTestId('heading-3')).toHaveTextContent('Welcome back, testuser!');
    });

    test('renders AuthenticatedRoute Header with email when username is not available', () => {
      // Mock the useAuthenticator hook to return a user with email
      useAuthenticator.mockReturnValue({
        user: { attributes: { email: 'test@example.com' } }
      });
      
      const AuthHeader = components.AuthenticatedRoute.Header;
      render(<AuthHeader />);
      
      expect(screen.getByTestId('heading-3')).toHaveTextContent('Welcome back, test@example.com!');
    });

    test('renders AuthenticatedRoute Header with default User when no user info is available', () => {
      // Mock the useAuthenticator hook to return an empty user
      useAuthenticator.mockReturnValue({
        user: {}
      });
      
      const AuthHeader = components.AuthenticatedRoute.Header;
      render(<AuthHeader />);
      
      expect(screen.getByTestId('heading-3')).toHaveTextContent('Welcome back, User!');
    });
  });
});