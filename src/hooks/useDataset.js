import { useEffect, useState } from 'react';

const sessionDatasetCache = new Map();

/**
 * Fetches dataset artifacts and keeps a per-session cache by dataset id.
 *
 * @param {number} id - Dataset id
 * @param {Map<number, object>} [externalCache] - Optional cache for tests or hosts
 * @param {Function} [setExternalCache] - Optional cache setter paired with externalCache
 * @returns {{ data: object|null, loading: boolean, error: string|null }}
 */
export function useDataset(id, externalCache, setExternalCache) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cache = externalCache ?? sessionDatasetCache;

    if (cache.has(id)) {
      setData(cache.get(id));
      setError(null);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;

    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/datasets/artifact_${id}.json`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Error al cargar Dataset ${id}. Asegurate de haber ejecutado el pipeline de Python.`,
          );
        }

        return res.json();
      })
      .then((jsonData) => {
        if (!isActive) {
          return;
        }

        if (setExternalCache) {
          setExternalCache((previousCache) => {
            const nextCache = new Map(previousCache);
            nextCache.set(id, jsonData);
            return nextCache;
          });
        } else {
          sessionDatasetCache.set(id, jsonData);
        }

        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        if (!isActive || err.name === 'AbortError') {
          return;
        }

        setError(err.message);
        setData(null);
        setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [id, externalCache, setExternalCache]);

  return { data, loading, error };
}
