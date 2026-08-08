/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HowItWorks from '@/components/landing/HowItWorks';

// Reason: framer-motion needs layout APIs jsdom lacks, and its animation props
// are not valid DOM attributes. Strip them and render a plain element; the
// toggle logic is what we test, not the animation.
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
    useInView: () => true,
  };
});

describe('HowItWorks', () => {
  it('renders no toggle when showTilesToggle is false', () => {
    render(<HowItWorks showTilesToggle={false} />);
    expect(screen.queryByRole('tab', { name: /^cookbook$/i })).not.toBeInTheDocument();
  });

  it('shows the cookbook steps by default when the toggle is on', () => {
    render(<HowItWorks showTilesToggle />);
    expect(screen.getByRole('tab', { name: /^cookbook$/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/we make the book/i)).toBeInTheDocument();
  });

  it('swaps to tiles copy when the tiles tab is clicked', async () => {
    const user = userEvent.setup();
    render(<HowItWorks showTilesToggle />);
    await user.click(screen.getByRole('tab', { name: /kitchen tiles/i }));
    expect(screen.getByRole('tab', { name: /kitchen tiles/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/we make the tiles/i)).toBeInTheDocument();
  });

  it('moves tab selection with the right arrow key', async () => {
    const user = userEvent.setup();
    render(<HowItWorks showTilesToggle />);
    const cookbookTab = screen.getByRole('tab', { name: /^cookbook$/i });
    const tilesTab = screen.getByRole('tab', { name: /kitchen tiles/i });

    cookbookTab.focus();
    await user.keyboard('{ArrowRight}');

    expect(tilesTab).toHaveAttribute('aria-selected', 'true');
    expect(tilesTab).toHaveFocus();
    expect(cookbookTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText(/we make the tiles/i)).toBeInTheDocument();
  });
});
