/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import FAQ from '@/components/landing/FAQ';

// Reason: framer-motion needs layout APIs jsdom lacks, and its animation props
// are not valid DOM attributes. Strip them and render a plain element; the
// gating logic is what we test, not the animation.
jest.mock('framer-motion', () => {
  const React = require('react');
  const ANIMATION_PROPS = [
    'initial', 'animate', 'whileInView', 'whileHover', 'whileTap',
    'viewport', 'transition', 'exit', 'variants', 'layout',
  ];
  const strip = (props: Record<string, unknown>) => {
    const clean: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (!ANIMATION_PROPS.includes(key)) clean[key] = props[key];
    }
    return clean;
  };
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) =>
          React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
            React.createElement(tag, { ...strip(props), ref })
          ),
      }
    ),
  };
});

describe('FAQ', () => {
  it('renders only the six pre-existing questions when both flags are false', () => {
    render(<FAQ />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6);
    expect(screen.queryByText(/what is a cookbook club/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/what are the framed tiles/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/do the tiles work the same way/i)).not.toBeInTheDocument();
  });

  it('renders nine questions when both flags are true', () => {
    render(<FAQ showClub showTiles />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(9);
    expect(screen.getByText(/what is a cookbook club/i)).toBeInTheDocument();
    expect(screen.getByText(/what are the framed tiles/i)).toBeInTheDocument();
    expect(screen.getByText(/do the tiles work the same way/i)).toBeInTheDocument();
  });
});
