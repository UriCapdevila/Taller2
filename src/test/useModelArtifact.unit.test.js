import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useModelArtifact } from '../hooks/useModelArtifact.js';

describe('useModelArtifact', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads lazily and reuses the session cache', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ title: 'Modelo de prueba' }),
    });

    const { result, rerender } = renderHook(
      ({ enabled }) => useModelArtifact(987, enabled),
      { initialProps: { enabled: false } },
    );

    expect(global.fetch).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.data?.title).toBe('Modelo de prueba'));
    expect(global.fetch).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
