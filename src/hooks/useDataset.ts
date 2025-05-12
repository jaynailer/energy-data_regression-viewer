import { useState, useEffect, useCallback } from 'react';
import type { DatasetResponse } from '../types/dataset';
import { getUserId } from '../utils/cookies';

export function useDatasetFetch(datasetId: string) {
  const [data, setData] = useState<DatasetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDataset = useCallback(async () => {
    if (!datasetId) {
      setError(new Error('No dataset ID provided. Please add a dataset_id parameter to the URL.'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();
      const headers = {
        'Accept': 'application/json'
      };

      const response = await fetch(
        `https://data.energy-data.io/api/fetch_dataset?user_id=${userId}&dataset_id=${datasetId}`,
        { headers }
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Dataset not found. Please check the dataset ID and try again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        }
        throw new Error('Failed to fetch dataset. Please try again later.');
      }

      // Replace NaN with null in the response text before parsing
      const text = await response.text();
      const sanitizedText = text
        .replace(/:NaN,/g, ':null,')
        .replace(/:NaN}/g, ':null}')
        .replace(/:"nan"/g, ':null');
      
      const jsonData = JSON.parse(sanitizedText);
      setData(jsonData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  return { data, loading, error };
}