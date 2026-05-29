import { localDatasets } from '../data/datasets';

/**
 * Custom hook for fetching local dataset artifacts synchronously.
 *
 * @param {number} id - Dataset id (1–4)
 * @returns {{ data: object|null, loading: boolean, error: string|null }}
 */
export function useDataset(id) {
  const data = localDatasets.find((dataset) => dataset.id === id) || null;
  
  return { 
    data, 
    loading: false, 
    error: data ? null : `Dataset con ID ${id} no encontrado en la base de datos local.` 
  };
}
