import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the landing page with Pulse26 title', () => {
    render(<App />);
    const titleElement = screen.getByText(/Pulse26/i);
    expect(titleElement).toBeInTheDocument();
  });
});
