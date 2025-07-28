import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByText('DIAM AI Pilot');
    expect(heading).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<App />);
    const subtitle = screen.getByText('Educational AI for ISCTE students');
    expect(subtitle).toBeInTheDocument();
  });

  it('renders the success message', () => {
    render(<App />);
    const message = screen.getByText('Project structure initialized successfully!');
    expect(message).toBeInTheDocument();
  });
});