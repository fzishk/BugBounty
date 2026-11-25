import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getLoggedErrors } from '../../lib/logger';
import { renderApp } from '../../test/renderApp';

describe('error boundary', () => {
  it('shows a fallback screen and logs the error instead of crashing the app', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderApp('/debug/crash');

    expect(await screen.findByRole('heading', { name: /unexpected bug/i })).toBeInTheDocument();
    // The rest of the app (header, navigation) is still there.
    expect(screen.getByRole('link', { name: /^cart,/i })).toBeInTheDocument();
    expect(getLoggedErrors()[0]?.message).toMatch(/deliberate crash/i);
    expect(consoleError).toHaveBeenCalledWith(
      '[bazaar:error]',
      expect.objectContaining({ source: 'react-error-boundary' }),
      expect.any(Error),
    );
  });
});
