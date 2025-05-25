import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoginHeader } from './playground';

// Test for the LoginHeader component
describe('LoginHeader Component', () => {
  test('renders login header with warning message', () => {
    render(<LoginHeader />);
    
    // Check if the login heading is rendered
    const headingElement = screen.getByText(/Login/i);
    expect(headingElement).toBeInTheDocument();
    
    // Check if the warning message is rendered
    const warningElement = screen.getByText(/Warning: Login with Caution/i);
    expect(warningElement).toBeInTheDocument();
  });
});