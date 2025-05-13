import React, { useRef, useEffect, useState } from 'react';
import { Network, SwitchCamera } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ZAxis } from 'recharts';
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

    console.log('Preparing chart data:', {
      selectedTemp,
      showSimple,
      totalDataPoints: data.dataset.usage_data.length
    });

    return data.dataset.usage_data
      .filter(entry => 
        typeof entry[selectedTemp] === 'number' && 
        !isNaN(entry[selectedTemp]) &&
        typeof entry.usage === 'number' && 
        !isNaN(entry.usage) &&
        typeof entry.predictor_1 === 'number' && 
        !isNaN(entry.predictor_1)
      )
      .map(entry => ({
        x: entry[selectedTemp],
        y: entry.usage,
        z: entry.predictor_1,
        size: showSimple ? 60 : entry.predictor_1
      }));
  };

  useEffect(() => {
    const chartData = prepareChartData();
    console.log('Chart data prepared:', {
    });
  }, [data, selectedTemp, showSimple]);

  const getRegressionLineData = () => {
    const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';
    console.log('Getting regression line data:', {
      showSimple,
      selectedTemp,
      predictorName
    });

    const results = showSimple 
      ? data?.dataset?.regression_results?.simple_regressions?.[selectedTemp]
      : data?.dataset?.regression_results?.multiple_regressions?.[`${selectedTemp}_${predictorName}`];

    console.log('Regression results:', results);

    if (!results?.coefficients) return [];

    const points = prepareChartData();
    if (points.length === 0) return [];

    if (showSimple) {
      const intercept = results.coefficients[0]?.coef ?? 0;
      const coefficient = results.coefficients[1]?.coef ?? 0;

      console.log('Regression line parameters:', {
        intercept,
        coefficient,
        pointCount: points.length
      });

      // Use actual x values for the line
      return points.map(point => ({
        x: point.x,
        y: intercept + coefficient * point.x
      }));
    }

    return [];
      dataPoints: chartData.length,
      samplePoint: chartData[0],
      selectedTemp,
      showSimple
    });

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
          className="bg-white rounded-[25px] p-4 overflow-hidden"
        >
          {results && (
            <div className="mb-4 text-sm text-[#2C5265]">
              <p>{formatEquation(results)}</p>
              <p>R² = {results.model_summary?.r_squared.toFixed(3) || 'N/A'}</p>
            </div>
          )}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 50, left: 60 }}>
                <CartesianGrid stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={selectedTemp}
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
                  label={{ value: 'Usage', angle: -90, position: 'insideLeft', offset: -20 }}
                />
                {!showSimple && (
                  <ZAxis
                    dataKey="size"
                    name={predictorName}
                    range={[50, 400]}
                  />
                )}
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 rounded shadow">
                        <p className="text-sm text-[#2C5265]">
                          {selectedTemp}: {data.x.toFixed(2)}
                        </p>
                        <p className="text-sm text-[#2C5265]">
                          Usage: {data.y.toFixed(2)}
                        </p>
                        {!showSimple && (
                          <p className="text-sm text-[#2C5265]">
                            {predictorName}: {data.z.toFixed(2)}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Scatter 
                  name="Data Points"
                  data={chartData}
                  fill={showSimple ? "#2C5265" : "#AD435A"}
                  fillOpacity={0.6}
                  shape="circle"
                  legendType="none"
                />
                {showSimple && lineData.length > 0 && (
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