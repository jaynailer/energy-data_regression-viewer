import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Line } from 'recharts';
import { useDatasetContext } from '../context/DatasetContext';

export function SimpleRegressionGraph() {
  const { data } = useDatasetContext();
  const [selectedTemp, setSelectedTemp] = useState<string>('');
  const [equation, setEquation] = useState<string>('');

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
        !isNaN(entry.usage)
      )
      .map(entry => ({
        x: entry[selectedTemp],
        y: entry.usage
      }));
  }, [data, selectedTemp]);

  const regressionLineData = React.useMemo(() => {
    if (!data?.dataset?.regression_results?.simple_regressions?.[selectedTemp]) return [];
    
    const results = data.dataset.regression_results.simple_regressions[selectedTemp];
    if (!results?.coefficients) return [];

    const intercept = results.coefficients[0]?.coef ?? 0;
    const coefficient = results.coefficients[1]?.coef ?? 0;

    // Update equation
    setEquation(`Usage = ${intercept.toFixed(2)} ${coefficient >= 0 ? '+' : ''}${coefficient.toFixed(2)} × ${formatTemp(selectedTemp)}`);

    // Create line with points at min and max x values
    const xValues = chartData.map(point => point.x);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);

    return [
      {
        x: xMin,
        y: intercept + coefficient * xMin
      },
      {
        x: xMax,
        y: intercept + coefficient * xMax
      }
    ];
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
    <div className="bg-white rounded-[25px] p-6">
      {equation && (
        <div className="mb-4 text-sm text-[#2C5265] font-mono">
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
              name={selectedTemp}
              label={{
                value: selectedTemp.toUpperCase(), 
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
                return (
                  <div className="bg-white p-2 border border-gray-200 rounded shadow">
                    <p className="text-sm text-[#2C5265]">
                      {formatTemp(selectedTemp)}: {data.x.toFixed(2)}
                    </p>
                    <p className="text-sm text-[#2C5265]">
                      Usage: {data.y.toFixed(2)}
                    </p>
                  </div>
                );
              }}
            />
            <Scatter
              data={chartData}
              fill="#2C5265"
              shape="circle" 
            />
            <Line
              data={regressionLineData}
              type="linear"
              dataKey="y"
              stroke="#AD435A"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}