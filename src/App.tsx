import React from 'react';
import { ProjectInfo } from './components/ProjectInfo';
import { Map } from './components/Map';
import { SimpleRegressionGraph } from './components/SimpleRegressionGraph';
import { StatisticalResults } from './components/StatisticalResults';
import { StatisticalResultsMultiple } from './components/StatisticalResultsMultiple';
import { ResultsInterpretation } from './components/ResultsInterpretation';
import { RefreshCw } from 'lucide-react';
import { useDatasetContext } from './context/DatasetContext';

function App() {
  const { 
    datasetId, 
    setDatasetId, 
    currentDatasetId, 
    setCurrentDatasetId,
    data,
    loading,
    error 
  } = useDatasetContext();

  const handleReload = () => {
    if (!datasetId) {
      return;
    }
    setCurrentDatasetId(datasetId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#2C5265]">Loading dataset...</p>
          <div className="animate-spin w-8 h-8 border-4 border-[#2C5265] border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center p-6">
        <div className="bg-white rounded-[25px] p-8 shadow-lg max-w-md w-full text-center space-y-6">
          <div className="text-[#AD435A] text-xl font-semibold mb-4">Error Loading Dataset</div>
          <p className="text-[#2C5265]">{error.message}</p>
          <div className="space-y-4">
            <p className="text-[#7984A5]">Please enter a valid dataset ID below:</p>
            <div className="flex gap-4">
              <input
                type="text"
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="flex-1 px-4 py-2 rounded-[25px] border border-[#7984A5]/30 focus:outline-none focus:ring-2 focus:ring-[#2C5265]"
                placeholder="Enter dataset ID"
              />
              <button
                onClick={handleReload}
                className="px-6 py-2 bg-[#2C5265] text-white rounded-[25px] hover:bg-[#2C5265]/90 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine regression type based on kind and number of predictors
  const kind = data?.dataset?.metadata?.parameters?.kind;
  const predictors = data?.dataset?.metadata?.parameters?.predictors || [];
  const showLinearRegression = kind === 'none' ? predictors.length === 1 : predictors.length === 0;

  return (
    <div className="min-h-screen bg-[#f5f7f5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <ProjectInfo />
        
        <div className="grid grid-cols-1 gap-6">
          <Map />
          <SimpleRegressionGraph />
          {showLinearRegression ? (
            <StatisticalResults />
          ) : (
            <StatisticalResultsMultiple />
          )}
          <ResultsInterpretation />
        </div>
        
      </div>
    </div>
  );
}

export default App