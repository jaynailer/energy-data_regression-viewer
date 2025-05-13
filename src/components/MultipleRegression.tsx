import React, { useRef, useEffect, useState } from 'react';
import { Network, SwitchCamera } from 'lucide-react';
import { ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { useDatasetContext } from '../context/DatasetContext';
import { useRegressionType } from '../context/RegressionTypeContext';

export function MultipleRegression() {
  const { data } = useDatasetContext();
  const { showSimple, setShowSimple } = useRegressionType();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTemp, setSelectedTemp] = useState<string>('');

  // Extract unique base temperatures from the data
  const baseTemps = data?.dataset?.usage_data?.[0] 
    ? Object.keys(data.dataset.usage_data[0])
      .filter(key => key.startsWith('HDD(') || key.startsWith('CDD('))
      .sort()
    : [];

  // Set initial selected temperature
  useEffect(() => {
    if (baseTemps.length > 0 && !selectedTemp) {
      setSelectedTemp(baseTemps[0]);
    }
  }, [baseTemps, selectedTemp]);

  // Format equation for display
  const formatEquation = (results: any) => {
    if (!results?.coefficients) return 'N/A';
    
    const coefficients = results.coefficients;
    const intercept = coefficients[0]?.coef ?? 0;
    const degreeDay = coefficients[1]?.coef ?? 0;
    const degreeDayVar = coefficients[1]?.variable ?? 'DD';
    const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';
    
    if (showSimple) {
      return `Usage = ${intercept.toFixed(2)} ${degreeDay >= 0 ? '+' : ''}${degreeDay.toFixed(2)} × ${degreeDayVar}`;
    } else {
      const predictor = coefficients[2]?.coef ?? 0;
      return `Usage = ${intercept.toFixed(2)} ${degreeDay >= 0 ? '+' : ''}${degreeDay.toFixed(2)} × ${degreeDayVar} ${predictor >= 0 ? '+' : ''}${predictor.toFixed(2)} × ${predictorName}`;
    }
  };

  const prepareChartData = () => {
    if (!data?.dataset?.usage_data || !selectedTemp) return [];

    const points = data.dataset.usage_data
      .filter(entry => 
        typeof entry[selectedTemp] === 'number' && 
        !isNaN(entry[selectedTemp]) &&
        typeof entry.usage === 'number' && 
        !isNaN(entry.usage) &&
        (!showSimple ? typeof entry.predictor_1 === 'number' && !isNaN(entry.predictor_1) : true)
      );

    if (points.length === 0) return [];

    return points.map(entry => ({
        x: showSimple ? entry[selectedTemp] : entry.predictor_1,
        y: entry.usage,
        z: !showSimple ? entry[selectedTemp] : undefined
      }));
  };

  const getRegressionLineData = () => {
    const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';
    const results = showSimple 
      ? data?.dataset?.regression_results?.simple_regressions?.[selectedTemp]
      : data?.dataset?.regression_results?.multiple_regressions?.[`${selectedTemp}_${predictorName}`];

    if (!results?.coefficients) return [];

    const points = prepareChartData();
    if (points.length === 0) return [];

    // Get min/max values for x axis
    const xMin = Math.min(...points.map(p => p.x));
    const xMax = Math.max(...points.map(p => p.x));
    
    const intercept = results.coefficients[0]?.coef ?? 0;
    const coefficient = results.coefficients[1]?.coef ?? 0;
    const predictor = !showSimple ? results.coefficients[2]?.coef ?? 0 : 0;
    
    // Create more points for a smoother line
    const numPoints = 100;
    const step = (xMax - xMin) / (numPoints - 1);
    
    // For multiple regression, we need the average temperature
    const avgTemp = !showSimple 
      ? points.reduce((sum, p) => sum + (p.z || 0), 0) / points.length
      : 0;

    return Array.from({ length: numPoints }, (_, i) => {
      const x = xMin + step * i;
      const y = showSimple
        ? intercept + coefficient * x
        : intercept + coefficient * avgTemp + predictor * x;
      return { x, y };
    });
  };

  const chartData = prepareChartData();
  const lineData = getRegressionLineData();
  const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';
  const results = showSimple 
    ? data?.dataset?.regression_results?.simple_regressions?.[selectedTemp]
    : data?.dataset?.regression_results?.multiple_regressions?.[`${selectedTemp}_${predictorName}`];

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
          className="bg-white rounded-[25px] p-4"
        >
          {results && (
            <div className="mb-4 text-sm text-[#2C5265]">
              <p>{formatEquation(results)}</p>
              <p>R² = {results.model_summary?.r_squared.toFixed(3) || 'N/A'}</p>
            </div>
          )}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={showSimple ? selectedTemp : predictorName}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => value.toLocaleString()}
                  label={{ value: showSimple ? selectedTemp : predictorName, position: 'bottom', offset: 20 }}
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
                          {showSimple ? selectedTemp : predictorName}: {data.x.toFixed(2)}
                        </p>
                        <p className="text-sm text-[#2C5265]">
                          Usage: {data.y.toFixed(2)}
                        </p>
                        {!showSimple && data.z !== undefined && (
                          <p className="text-sm text-[#2C5265]">
                            {selectedTemp}: {data.z.toFixed(2)}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Scatter 
                  name="Data Points"
                  data={chartData}
                  fill="#2C5265"
                  opacity={0.5}
                  r={4}
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
      </div>
    </div>
  );
}