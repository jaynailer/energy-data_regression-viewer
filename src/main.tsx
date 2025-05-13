import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { DatasetProvider } from './context/DatasetContext';
import { RegressionTypeProvider } from './context/RegressionTypeContext';
import { setupIframeResize } from './utils/iframeResize';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Initialize iframe resize functionality
setupIframeResize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <DatasetProvider>
        <RegressionTypeProvider>
          <App />
        </RegressionTypeProvider>
      </DatasetProvider>
    </ErrorBoundary>
  </StrictMode>
);