import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useDatasetContext } from '../context/DatasetContext';

export function SimpleRegressionGraph() {
  const { data } = useDatasetContext();
  const [selectedTemp, setSelectedTemp] = useState<string>('');

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
            <Scatter
              data={chartData}
              fill="#2C5265"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}