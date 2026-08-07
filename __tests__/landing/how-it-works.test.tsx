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
  it('renders no toggle when showClubToggle is false', () => {
    render(<HowItWorks showClubToggle={false} />);
    expect(screen.queryByRole('tab', { name: /as a gift/i })).not.toBeInTheDocument();
  });

  it('shows the gift steps by default when the toggle is on', () => {
    render(<HowItWorks showClubToggle />);
    expect(screen.getByRole('tab', { name: /as a gift/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/they send a recipe/i)).toBeInTheDocument();
  });

  it('swaps to club copy when the club tab is clicked', async () => {
    const user = userEvent.setup();
    render(<HowItWorks showClubToggle />);
    await user.click(screen.getByRole('tab', { name: /as a club/i }));
    expect(screen.getByRole('tab', { name: /as a club/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/everyone gets a copy/i)).toBeInTheDocument();
  });

  it('moves tab selection with the right arrow key', async () => {
    const user = userEvent.setup();
    render(<HowItWorks showClubToggle />);
    const giftTab = screen.getByRole('tab', { name: /as a gift/i });
    const clubTab = screen.getByRole('tab', { name: /as a club/i });

    giftTab.focus();
    await user.keyboard('{ArrowRight}');

    expect(clubTab).toHaveAttribute('aria-selected', 'true');
    expect(clubTab).toHaveFocus();
    expect(giftTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText(/everyone gets a copy/i)).toBeInTheDocument();
  });
});
