import React from 'react';
import { render, screen } from '@testing-library/react';
import Greeting from './greeting';

describe('Greeting Component', () => {
  // Mock the Date object to control time-based greetings
  const mockDate = new Date('2023-01-01T08:00:00'); // Morning time
  const originalDate = global.Date;
  
  beforeEach(() => {
    global.Date = class extends Date {
      constructor() {
        return mockDate;
      }
      
      static now() {
        return mockDate.getTime();
      }
    };
  });
  
  afterEach(() => {
    global.Date = originalDate;
  });

  test('renders nothing when userInfo is null', () => {
    const { container } = render(<Greeting userInfo={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders morning greeting with user name from email', () => {
    const userInfo = { email: 'testuser@example.com' };
    render(<Greeting userInfo={userInfo} />);
    
    expect(screen.getByText('Good morning, testuser!')).toBeInTheDocument();
  });

  test('renders afternoon greeting', () => {
    // Set time to afternoon
    mockDate.setHours(14);
    
    const userInfo = { email: 'testuser@example.com' };
    render(<Greeting userInfo={userInfo} />);
    
    expect(screen.getByText('Good afternoon, testuser!')).toBeInTheDocument();
  });

  test('renders evening greeting', () => {
    // Set time to evening
    mockDate.setHours(20);
    
    const userInfo = { email: 'testuser@example.com' };
    render(<Greeting userInfo={userInfo} />);
    
    expect(screen.getByText('Good evening, testuser!')).toBeInTheDocument();
  });

  test('applies custom className when provided', () => {
    const userInfo = { email: 'testuser@example.com' };
    const { container } = render(<Greeting userInfo={userInfo} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});