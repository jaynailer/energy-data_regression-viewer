import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { LineChart } from 'lucide-react';
import { useDatasetContext } from '../context/DatasetContext';
import { useRegressionType } from '../context/RegressionTypeContext';

export function SimpleRegressionGraph() {
  const { data } = useDatasetContext();
  const { showSimple } = useRegressionType();
  const [selectedTemp, setSelectedTemp] = useState<string>('');
  const [equation, setEquation] = useState<string>('');

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
    const unit = data?.dataset?.metadata?.parameters?.unit || 'metric';
    const unitSymbol = unit === 'imperial' ? '°F' : unit === 'metric' ? '°C' : '';
    return `${kind.toUpperCase()} (${parseFloat(baseTemp)}${unitSymbol})`;
  };

  const chartData = React.useMemo(() => {
    if (!data?.dataset?.usage_data || !selectedTemp) return [];

    const validPoints = data.dataset.usage_data
      .filter(entry => {
        if (isPredictor) {
          return typeof entry.predictor_1 === 'number' && 
                 !isNaN(entry.predictor_1) &&
                 typeof entry.usage === 'number' && 
                 !isNaN(entry.usage);
        }
        return typeof entry[selectedTemp] === 'number' && 
               !isNaN(entry[selectedTemp]) &&
               typeof entry.usage === 'number' && 
               !isNaN(entry.usage);
      })
      .map((entry: any) => ({
        x: isPredictor ? entry.predictor_1 : entry[selectedTemp],
        predictor_x: entry.predictor_1,
        y: entry.usage,
        begin_period: entry.begin_period,
        end_period: entry.end_period
      }));
  }, [data, selectedTemp, isPredictor]);

  const regressionLineData = React.useMemo(() => {
    if (chartData.length === 0) return [];

    const regressionKey = isPredictor ? 'none' : selectedTemp;
    const results = isPredictor 
      ? data?.dataset?.regression_results?.none
      : data?.dataset?.regression_results?.simple_regressions?.[selectedTemp];

    if (!results?.coefficients) return [];

    const intercept = results.coefficients[0]?.coef ?? 0;
    const coefficient = results.coefficients[1]?.coef ?? 0;
    const r2 = results.model_summary?.r_squared;

    // Update equation
    setEquation(`Usage = ${intercept.toFixed(2)} ${coefficient >= 0 ? '+' : ''}${coefficient.toFixed(2)} × ${isPredictor ? predictorName : formatTemp(selectedTemp)} (R² = ${r2.toFixed(3)})`);

    // Create line with points at min and max x values
    const xValues = chartData.map(point => point.x);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);

    return [
      { x: xMin, y: intercept + coefficient * xMin },
      { x: xMax, y: intercept + coefficient * xMax }
    ];
  }, [data, selectedTemp, chartData, isPredictor, predictorName]);


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
        {equation && (
          <div className="mb-4 space-y-1 text-sm text-[#2C5265] font-mono">
            {equation}
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
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                const regressionKey = isPredictor ? 'none' : selectedTemp;
                const results = isPredictor 
                  ? data?.dataset?.regression_results?.none
                  : data?.dataset?.regression_results?.simple_regressions?.[selectedTemp];

                const intercept = results?.coefficients?.[0]?.coef ?? 0;
                const coefficient = results?.coefficients?.[1]?.coef ?? 0;
                const predicted = intercept + coefficient * data.x;

                return (
                  <div className="bg-white p-2 border border-gray-200 rounded shadow">
                    <div className="space-y-1 text-sm">
                      <p className="text-[#2C5265]">Period: {new Date(data.begin_period).toLocaleDateString()} - {new Date(data.end_period).toLocaleDateString()}</p>
                      <p className="text-[#2C5265]">{isPredictor ? predictorName : formatTemp(selectedTemp)}: {data.x.toFixed(2)}</p>
                      <p className="text-[#2C5265]">Actual Usage: {data.y.toFixed(2)}</p>
                      <p className="text-[#2C5265]">Predicted Usage: {predicted.toFixed(2)}</p>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter
              data={chartData.map(point => ({ x: point.x, y: point.y }))}
              fill="#2C5265"
              shape="circle"
              legendType="none"
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