import React, { useRef, useEffect, useState } from 'react';
import { Network, SwitchCamera } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Line } from 'recharts';
import { useDatasetContext } from '../context/DatasetContext';
import { useRegressionType } from '../context/RegressionTypeContext';

export function MultipleRegression() {
  const { data } = useDatasetContext();
  const { showSimple, setShowSimple } = useRegressionType();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTemp, setSelectedTemp] = useState<string>(() => {
    if (!data?.dataset?.usage_data?.[0]) return '';
    
    // Find the first temperature key that has valid data
    const temps = Object.keys(data.dataset.usage_data[0])
      .filter(key => key.match(/^(hdd|cdd)\(\d+(?:\.\d+)?\)$/i))
      .sort();
    
    return temps[0] || '';
  });

  // Move predictorName declaration here, before it's used
  const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';

  // Extract unique base temperatures from the data
  const baseTemps = data?.dataset?.usage_data?.[0] 
    ? Object.keys(data.dataset.usage_data[0])
      .filter(key => key.startsWith('HDD(') || key.startsWith('CDD('))
      .sort()
    : [];

  // Set initial selected temperature
  useEffect(() => {
    if (baseTemps.length > 0 && !selectedTemp) {
      const firstTemp = baseTemps[0];
      console.log('Setting initial temperature:', firstTemp);
      setSelectedTemp(firstTemp);
    }
  }, [baseTemps, selectedTemp]);

  // Format equation for display
  const formatEquation = (results: any) => {
    if (!results?.coefficients) return 'N/A';
    
    const coefficients = results.coefficients;
    const intercept = coefficients[0]?.coef ?? 0;
    const degreeDay = coefficients[1]?.coef ?? 0;
    const degreeDayVar = coefficients[1]?.variable ?? 'DD';
    
    if (showSimple) {
      return `Usage = ${intercept.toFixed(2)} ${degreeDay >= 0 ? '+' : ''}${degreeDay.toFixed(2)} × ${degreeDayVar}`;
    } else {
      const predictor = coefficients[2]?.coef ?? 0;
      return `Usage = ${intercept.toFixed(2)} ${degreeDay >= 0 ? '+' : ''}${degreeDay.toFixed(2)} × ${degreeDayVar} ${predictor >= 0 ? '+' : ''}${predictor.toFixed(2)} × ${predictorName}`;
    }
  };

  const prepareChartData = () => {
    if (!data?.dataset?.usage_data || !selectedTemp) return [];

    const validPoints = data.dataset.usage_data
      .filter(entry => 
        typeof entry[selectedTemp] === 'number' && 
        !isNaN(entry[selectedTemp]) &&
        typeof entry.usage === 'number' && 
        !isNaN(entry.usage) &&
        typeof entry.predictor_1 === 'number' && 
        !isNaN(entry.predictor_1)
      );

    return validPoints
      .map(entry => ({
        x: entry[selectedTemp],
        y: entry.usage,
        z: entry.predictor_1
      }));
  };

  const getRegressionLineData = () => {
    if (!selectedTemp) return [];
    
    const regressionKey = showSimple ? 'simple_regressions' : 'multiple_regressions';
    const results = showSimple 
      ? data?.dataset?.regression_results?.[regressionKey]?.[selectedTemp]
      : data?.dataset?.regression_results?.[regressionKey]?.[`${selectedTemp}_${predictorName}`];

    if (!results?.coefficients) return [];

    const points = prepareChartData();
    if (points.length === 0) return [];

    const intercept = results.coefficients[0]?.coef ?? 0;
    const coefficient = results.coefficients[1]?.coef ?? 0;
    const predictor = !showSimple ? results.coefficients[2]?.coef ?? 0 : 0;

    // Sort points by x value for smooth line
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);

    // Create line points
    return sortedPoints.map(point => ({
      x: point.x,
      y: showSimple 
        ? intercept + coefficient * point.x
        : intercept + coefficient * point.x + predictor * point.z
    }));
  };

  const formatTemp = (temp: string) => {
    const match = temp.match(/(hdd|cdd)\((\d+(?:\.\d+)?)\)/i);
    if (!match) return temp;
    const [_, kind, baseTemp] = match;
    return `${kind.toUpperCase()} (${parseFloat(baseTemp)}°C)`;
  };

  const chartData = prepareChartData();
  const lineData = getRegressionLineData();
  const regressionKey = showSimple ? 'simple_regressions' : 'multiple_regressions';
  const results = showSimple 
    ? data?.dataset?.regression_results?.[regressionKey]?.[selectedTemp]
    : data?.dataset?.regression_results?.[regressionKey]?.[`${selectedTemp}_${predictorName}`];

  return (
    <div className="bg-[#f5f7f5] rounded-[25px] p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-[#2C5265]" />
          <h2 className="text-2xl font-bold text-[#2C5265]">{showSimple ? 'Simple' : 'Multiple'} Regression</h2>
        </div>
        <div className="flex items-center gap-4">
          {baseTemps.length > 1 && (
            <div className="flex gap-2">
              {baseTemps.map(temp => (
                <button
                  key={temp}
                  onClick={() => setSelectedTemp(temp)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTemp === temp
                      ? 'bg-[#2C5265] text-white'
                      : 'bg-white text-[#2C5265] hover:bg-[#2C5265]/10'
                  }`}
                > 
                  {temp.replace(/^(cdd|hdd)/i, (match) => match.toUpperCase())}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowSimple(!showSimple)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-[#2C5265] hover:bg-[#2C5265]/10 transition-colors"
          >
            <SwitchCamera className="w-4 h-4" />
            <span>Switch to {showSimple ? 'Multiple' : 'Simple'} Regression</span>
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div 
          className="bg-white rounded-[25px] p-6 overflow-hidden"
        >
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 50, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={formatTemp(selectedTemp)}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{ value: selectedTemp, position: 'bottom', offset: 20 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Usage"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{ value: 'Usage', angle: -90, position: 'insideLeft', offset: -40 }}
                />
                <Scatter 
                  name="Data Points"
                  data={chartData}
                  fill="#2C5265"
                  shape="circle"
                  legendType="none"
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
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}