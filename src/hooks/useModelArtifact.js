import { useEffect, useState } from 'react';

const sessionModelCache = new Map();

export function useModelArtifact(id, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (sessionModelCache.has(id)) {
      setData(sessionModelCache.get(id));
      setError(null);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;
    setLoading(true);
    setError(null);

    fetch(`/datasets/model_${id}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el resultado del modelo predictivo.');
        }
        return response.json();
      })
      .then((artifact) => {
        if (!isActive) return;
        sessionModelCache.set(id, artifact);
        setData(artifact);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (!isActive || fetchError.name === 'AbortError') return;
        setError(fetchError.message);
        setData(null);
        setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [enabled, id]);

  return { data, loading, error };
}
