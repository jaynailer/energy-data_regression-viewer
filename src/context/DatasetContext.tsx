import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDatasetIdFromUrl } from '../utils/urlParams';
import { useDatasetFetch } from '../hooks/useDataset';
import type { DatasetResponse } from '../types/dataset';

interface DatasetContextType {
  datasetId: string;
  setDatasetId: (id: string) => void;
  currentDatasetId: string;
  setCurrentDatasetId: (id: string) => void;
  data: DatasetResponse | null;
  loading: boolean;
  error: Error | null;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [datasetId, setDatasetId] = useState(() => {
    const urlDatasetId = getDatasetIdFromUrl();
    return urlDatasetId || '';
  });
  const [currentDatasetId, setCurrentDatasetId] = useState(datasetId);

  const { data, loading, error } = useDatasetFetch(currentDatasetId);

  useEffect(() => {
    const handleUrlChange = () => {
      const urlDatasetId = getDatasetIdFromUrl();
      setDatasetId(urlDatasetId || '');
      setCurrentDatasetId(urlDatasetId || '');
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  return (
    <DatasetContext.Provider value={{ 
      datasetId, 
      setDatasetId, 
      currentDatasetId, 
      setCurrentDatasetId,
      data,
      loading,
      error
    }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDatasetContext() {
  const context = useContext(DatasetContext);
  if (context === undefined) {
    throw new Error('useDatasetContext must be used within a DatasetProvider');
  }
  return context;
}