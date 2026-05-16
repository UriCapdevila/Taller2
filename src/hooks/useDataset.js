import { useState, useEffect } from 'react';

/**
 * Custom hook for fetching and caching dataset artifacts.
 *
 * @param {number} id - Dataset id (1–4)
 * @param {Map<number, object>} cache - Shared in-memory cache from App
 * @param {function} setCache - Setter to update the cache Map
 * @returns {{ data: object|null, loading: boolean, error: string|null }}
 */
export function useDataset(id, cache, setCache) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cache hit — no fetch needed
    if (cache.has(id)) {
      return;
    }

    let ignore = false;

    async function fetchDataset() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/datasets/artifact_${id}.json`);

        if (!response.ok) {
          if (!ignore) {
            setError(
              `Error loading dataset ${id}: server responded with status ${response.status}.`
            );
            setLoading(false);
          }
          return;
        }

        const artifact = await response.json();

        if (!ignore) {
          setCache((prev) => new Map(prev).set(id, artifact));
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            `Network error while loading dataset ${id}. Please check your connection and try again.`
          );
          setLoading(false);
        }
      }
    }

    fetchDataset();

    return () => {
      ignore = true;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const data = cache.get(id) ?? null;

  return { data, loading, error };
}
