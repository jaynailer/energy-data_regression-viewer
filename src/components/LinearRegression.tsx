import React, { useState, useRef, useEffect } from 'react';
import { LineChart } from 'lucide-react';
import { ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useDatasetContext } from '../context/DatasetContext';

export function LinearRegression() {
  const { data } = useDatasetContext();
  const [selectedTemp, setSelectedTemp] = useState<string>('');
  
  const kind = data?.dataset?.metadata?.parameters?.kind;
  const predictors = data?.dataset?.metadata?.parameters?.predictors || [];
  const isPredictor = kind === 'none' && predictors.length === 1;
  
  // Get predictor name if available
  const predictorName = isPredictor ? predictors[0]?.name || 'Predictor 1' : '';
  
  // Extract unique base temperatures from the data
  const formatTemp = (temp: string) => {
    const match = temp.match(/(hdd|cdd)\((\d+(?:\.\d+)?)\)/i);
    if (!match) return temp;
    const [_, kind, baseTemp] = match;
    return `${kind.toUpperCase()} (${parseFloat(baseTemp)}°C)`;
  };

  const baseTemps = !isPredictor && data?.dataset?.usage_data?.[0]
    ? Object.keys(data.dataset.usage_data[0])
        .filter(key => key.startsWith('hdd(') || key.startsWith('cdd('))
        .sort()
    : [];

  // Set initial selected temperature
  useEffect(() => {
    if (baseTemps.length > 0 && !selectedTemp) {
      setSelectedTemp(baseTemps[0]);
    }
  }, [baseTemps, selectedTemp]);

  // Get regression coefficients and statistics
  const getRegressionData = (key: string) => {
    if (!data?.dataset?.regression_results) return null;
    
    const results = isPredictor 
      ? data.dataset.regression_results.none
      : data.dataset.regression_results[key];

    if (!results) return null;
    
    const intercept = results.coefficients.find(r => r.variable === 'const')?.coef ?? 0;
    const coefficient = isPredictor
      ? results.coefficients.find(r => r.variable === 'predictor_1')?.coef ?? 0
      : results.coefficients.find(r => r.variable === key)?.coef ?? 0;
    const rSquared = results.model_summary.r_squared;
    
    return { intercept, coefficient, rSquared };
  };

  const prepareChartData = () => {
    if (!data?.dataset?.usage_data) return [];
    if (!isPredictor && !selectedTemp) return;

    return data.dataset.usage_data.map(entry => ({
      x: isPredictor ? entry.predictor_1 : entry[selectedTemp],
      y: entry.usage
    }));
  };

  const getRegressionLineData = () => {
    const key = isPredictor ? 'none' : selectedTemp;
    const regressionData = getRegressionData(key);
    if (!regressionData) return [];

    const { intercept, coefficient } = regressionData;
    const points = prepareChartData();
    const xMax = Math.max(...points.map(p => p.x));
    
    // Create line with two points: one at x=0 and one at x=max
    return [
      { x: 0, y: intercept },
      { x: xMax, y: intercept + coefficient * xMax }
    ];
  };

  const chartData = prepareChartData();
  const lineData = getRegressionLineData();
  const regressionData = getRegressionData(isPredictor ? 'none' : selectedTemp);

  return (
    <div className="bg-[#f5f7f5] rounded-[25px] p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <LineChart className="w-6 h-6 text-[#2C5265]" />
        <h2 className="text-2xl font-bold text-[#2C5265]">Linear Regression</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-6">
          {/* Graph */}
          <div className="flex-1 bg-white rounded-[25px] p-4">
            {regressionData && (
              <div className="mb-4 text-sm text-[#2C5265]">
                <p>Usage = {regressionData.intercept.toFixed(2)} {regressionData.coefficient >= 0 ? '+' : ''}{regressionData.coefficient.toFixed(2)} × {isPredictor ? predictorName : selectedTemp}</p>
                <p>R² = {regressionData.rSquared.toFixed(3)}</p>
              </div>
            )}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={isPredictor ? predictorName : selectedTemp}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.toLocaleString()}
                    label={{ value: isPredictor ? predictorName : formatTemp(selectedTemp), position: 'bottom', offset: 20 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Usage"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.toLocaleString()}
                    label={{ value: 'Usage', angle: -90, position: 'insideLeft', offset: -20 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow">
                          <p className="text-sm text-[#2C5265]">
                            {isPredictor ? predictorName : selectedTemp}: {data.x.toFixed(2)}
                          </p>
                          <p className="text-sm text-[#2C5265]">
                            Usage: {data.y.toFixed(2)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Scatter 
                    name="Data Points"
                    data={chartData}
                    fill="#2C5265"
                  />
                  {lineData.length > 0 && (
                    <Line
                      type="linear"
                      dataKey="y"
                      data={lineData}
                      stroke="#AD435A"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                   )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Controls and equation */}
          {!isPredictor && baseTemps.length > 1 && (
            <div className="w-48 space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-[#2C5265]">Base Temperature</h3>
                <div className="flex flex-col gap-2">
                  {baseTemps.map(temp => (
                    <button
                      key={temp}
                      onClick={() => setSelectedTemp(temp)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors text-left ${
                        selectedTemp === temp
                          ? 'bg-[#2C5265] text-white'
                          : 'bg-white text-[#2C5265] hover:bg-[#2C5265]/10'
                      }`}
                    >
                      {formatTemp(temp)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}