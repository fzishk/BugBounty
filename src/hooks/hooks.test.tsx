import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';
import { useScrollThreshold } from './useScrollThreshold';

describe('useDebouncedValue', () => {
  afterEach(() => vi.useRealTimers());

  it('only emits the last value after the user stops typing', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'd' },
    });
    rerender({ value: 'du' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'duck' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('d'); // nothing emitted mid-typing
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('duck');
  });
});

describe('useScrollThreshold', () => {
  it('shows past the threshold and stops listening after unmount', async () => {
    function Probe() {
      return <p>{useScrollThreshold(400) ? 'past' : 'top'}</p>;
    }
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Probe />);
    expect(screen.getByText('top')).toBeInTheDocument();

    await act(async () => {
      Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });
      window.dispatchEvent(new Event('scroll'));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(screen.getByText('past')).toBeInTheDocument();

    unmount();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });
});
