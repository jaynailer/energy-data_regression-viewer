import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { LineChart } from 'lucide-react';
import { useDatasetContext } from '../context/DatasetContext';
import { useRegressionType } from '../context/RegressionTypeContext';

export function SimpleRegressionGraph() {
  const { data } = useDatasetContext();
  const { showSimple } = useRegressionType();
  const [selectedTemp, setSelectedTemp] = useState<string>('');
  const [regressionParams, setRegressionParams] = useState<{ intercept: number; coefficient: number } | null>(null);
  const [rSquared, setRSquared] = useState<number | null>(null);
  const [regressionPoints, setRegressionPoints] = useState<Array<{ x: number; y: number }>>([]);

  const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';
  const kind = data?.dataset?.metadata?.parameters?.kind;
  const predictors = data?.dataset?.metadata?.parameters?.predictors || [];
  const isPredictor = kind === 'none' && predictors.length === 1;

  // Get the first available temperature on component mount
  useEffect(() => {
    if (!data?.dataset?.usage_data?.[0]) return;
    
    const temps = Object.keys(data.dataset.usage_data[0])
      .filter(key => key.match(/^(cdd|hdd)\(\d+(?:\.\d+)?\)$/i))
      .sort();
    
    if (temps.length > 0) {
      setSelectedTemp(temps[0]);
    }
  }, [data]);

  // Format temperature for display
  const formatTemp = (temp: string) => {
    const match = temp.match(/(hdd|cdd)\((\d+(?:\.\d+)?)\)/i);
    if (!match) return temp;
    const [_, kind, baseTemp] = match;
    return `${kind.toUpperCase()} (${parseFloat(baseTemp)}°C)`;
  };

  const chartData = React.useMemo(() => {
    if (!data?.dataset?.usage_data || !selectedTemp) return [];

    return data.dataset.usage_data
      .filter(entry => 
        typeof entry[selectedTemp] === 'number' && 
        !isNaN(entry[selectedTemp]) &&
        typeof entry.usage === 'number' && 
        !isNaN(entry.usage) &&
        (!isPredictor || (typeof entry.predictor_1 === 'number' && !isNaN(entry.predictor_1)))
      )
      .map(entry => ({
        x: isPredictor ? entry.predictor_1 : entry[selectedTemp],
        y: entry.usage,
        begin_period: entry.begin_period,
        end_period: entry.end_period,
        predictor_1: entry.predictor_1
      }));
  }, [data, selectedTemp]);

  const regressionLineData = React.useMemo(() => {
    const regressionKey = isPredictor ? 'none' : selectedTemp;
    const results = data?.dataset?.regression_results?.simple_regressions?.[regressionKey];
    
    if (!results?.coefficients || chartData.length === 0) return [];

    const intercept = results.coefficients[0]?.coef ?? 0;
    const coefficient = results.coefficients[1]?.coef ?? 0;
    const r2 = results.model_summary?.r_squared;

    // Update regression parameters
    setRegressionParams({ intercept, coefficient });
    setRSquared(r2);

    // Create regression line points with extended range
    const xMin = 0; // Start from 0
    const xMax = Math.max(...chartData.map(point => point.x)) * 1.2; // Extend 20% beyond max

    // Create two points for the regression line
    const points = [
      { x: xMin, y: intercept + coefficient * xMin },
      { x: xMax, y: intercept + coefficient * xMax }
    ];

    setRegressionPoints(points);
    return points;
  }, [data, selectedTemp, chartData]);


  if (!selectedTemp || chartData.length === 0) {
    return (
      <div className="bg-white rounded-[25px] p-6">
        <div className="text-center text-gray-500">
          No data available for visualization
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f7f5] rounded-[25px] p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <LineChart className="w-6 h-6 text-[#2C5265]" />
          <h2 className="text-2xl font-bold text-[#2C5265]">
            {isPredictor ? `${predictorName} Regression` : 'Simple Regression'}
          </h2>
        </div>
        {!isPredictor && <div className="flex gap-2">
          {Object.keys(data?.dataset?.usage_data?.[0] || {})
            .filter(key => key.match(/^(cdd|hdd)\(\d+(?:\.\d+)?\)$/i))
            .sort()
            .map(temp => (
              <button
                key={temp}
                onClick={() => setSelectedTemp(temp)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedTemp === temp
                    ? 'bg-[#2C5265] text-white'
                    : 'bg-white text-[#2C5265] hover:bg-[#2C5265]/10'
                }`}
              >
                {formatTemp(temp)}
              </button>
            ))}
        </div>
        }
      </div>
      
      <div className="bg-white rounded-[25px] p-6">
        {regressionParams && (
          <div className="mb-4 text-sm text-[#2C5265] font-mono">
            Usage = {regressionParams.intercept.toFixed(2)} {regressionParams.coefficient >= 0 ? '+' : ''}{regressionParams.coefficient.toFixed(2)} × {isPredictor ? predictorName : formatTemp(selectedTemp)}
          </div>
        )}
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 50, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              type="number"
              dataKey="x"
              name={isPredictor ? predictorName : selectedTemp}
              label={{
                value: isPredictor ? predictorName : selectedTemp.toUpperCase(), 
                position: 'bottom', 
                offset: 20 
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Usage" 
              label={{ 
                value: 'Usage', 
                angle: -90, 
                position: 'insideLeft', 
                offset: -40 
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length || !regressionParams) return null;
                const data = payload[0].payload;

                // Calculate predicted value for current x
                const predictedY = regressionParams.intercept + regressionParams.coefficient * data.x;

                return (
                  <div className="bg-white p-2 border border-gray-200 rounded shadow">
                    <p className="text-sm text-[#2C5265] font-mono border-b border-gray-100 pb-2 mb-2">Usage = {regressionParams.intercept.toFixed(2)} {regressionParams.coefficient >= 0 ? '+' : ''}{regressionParams.coefficient.toFixed(2)} × {isPredictor ? predictorName : formatTemp(selectedTemp)}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-[#2C5265]">Period: {new Date(data.begin_period).toLocaleDateString()} - {new Date(data.end_period).toLocaleDateString()}</p>
                      <p className="text-[#2C5265]">{isPredictor ? predictorName : formatTemp(selectedTemp)}: {data.x.toFixed(2)}</p>
                      <p className="text-[#2C5265]">Actual Usage: {data.y.toFixed(2)}</p>
                      <p className="text-[#2C5265]">Predicted Usage: {predictedY.toFixed(2)}</p>
                      <p className="text-[#2C5265] mt-2">R² = {rSquared?.toFixed(3) || 'N/A'}</p>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter
              data={chartData}
              fill="#2C5265" 
              shape="circle" 
            />
            <Scatter
              data={regressionLineData}
              legendType="none"
              fill="#AD435A"
              stroke="#AD435A"
              strokeWidth={2}
              line={true}
              shape={() => null}
              isAnimationActive={false}
            />
          </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}