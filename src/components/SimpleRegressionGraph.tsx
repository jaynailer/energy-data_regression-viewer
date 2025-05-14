import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { LineChart } from 'lucide-react';
import { useDatasetContext } from '../context/DatasetContext';
import { useRegressionType } from '../context/RegressionTypeContext';

export function SimpleRegressionGraph() {
  const { data } = useDatasetContext();
  const { showSimple } = useRegressionType();
  const [selectedTemp, setSelectedTemp] = useState<string>('');
  const [regressionParams, setRegressionParams] = useState<{ 
    temp?: { intercept: number; coefficient: number; r2: number }; 
    predictor?: { intercept: number; coefficient: number; r2: number }; 
  } | null>(null);
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
    const unit = data?.dataset?.metadata?.parameters?.unit || 'metric';
    const unitSymbol = unit === 'imperial' ? '°F' : unit === 'metric' ? '°C' : '';
    return `${kind.toUpperCase()} (${parseFloat(baseTemp)}${unitSymbol})`;
  };

  const chartData = React.useMemo(() => {
    if (!data?.dataset?.usage_data || !selectedTemp) return [];

    const validData = data.dataset.usage_data
      .filter(entry => 
        typeof entry[selectedTemp] === 'number' && 
        !isNaN(entry[selectedTemp]) &&
        typeof entry.usage === 'number' && 
        !isNaN(entry.usage) &&
        (typeof entry.predictor_1 === 'number' && !isNaN(entry.predictor_1))
      )
      .map(entry => ({
        x: entry[selectedTemp],
        predictor_x: entry.predictor_1,
        y: entry.usage,
        begin_period: entry.begin_period,
        end_period: entry.end_period
      }));

    return validData;
  }, [data, selectedTemp]);

  const regressionLineData = React.useMemo(() => {
    if (chartData.length === 0) return [];

    // Get regression results for both temperature and predictor
    const tempResults = data?.dataset?.regression_results?.simple_regressions?.[selectedTemp];
    const predictorResults = data?.dataset?.regression_results?.simple_regressions?.none;
    
    const params: any = {};

    if (tempResults?.coefficients) {
      params.temp = {
        intercept: tempResults.coefficients[0]?.coef ?? 0,
        coefficient: tempResults.coefficients[1]?.coef ?? 0,
        r2: tempResults.model_summary?.r_squared
      };
    }

    if (predictorResults?.coefficients) {
      params.predictor = {
        intercept: predictorResults.coefficients[0]?.coef ?? 0,
        coefficient: predictorResults.coefficients[1]?.coef ?? 0,
        r2: predictorResults.model_summary?.r_squared
      };
    }

    setRegressionParams(params);

    // Create regression lines
    const lines = [];

    if (params.temp) {
      const xMin = 0;
      const xMax = Math.max(...chartData.map(point => point.x)) * 1.2;
      lines.push({
        type: 'temp',
        points: [
          { x: xMin, y: params.temp.intercept + params.temp.coefficient * xMin },
          { x: xMax, y: params.temp.intercept + params.temp.coefficient * xMax }
        ]
      });
    }

    if (params.predictor) {
      const xMin = 0;
      const xMax = Math.max(...chartData.map(point => point.predictor_x)) * 1.2;
      lines.push({
        type: 'predictor',
        points: [
          { x: xMin, y: params.predictor.intercept + params.predictor.coefficient * xMin },
          { x: xMax, y: params.predictor.intercept + params.predictor.coefficient * xMax }
        ]
      });
    }

    return lines;
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
          <div className="mb-4 space-y-1 text-sm text-[#2C5265] font-mono">
            {regressionParams.temp && (
              <div>
                Temperature: Usage = {regressionParams.temp.intercept.toFixed(2)} {regressionParams.temp.coefficient >= 0 ? '+' : ''}{regressionParams.temp.coefficient.toFixed(2)} × {formatTemp(selectedTemp)} (R² = {regressionParams.temp.r2.toFixed(3)})
              </div>
            )}
            {regressionParams.predictor && (
              <div>
                {predictorName}: Usage = {regressionParams.predictor.intercept.toFixed(2)} {regressionParams.predictor.coefficient >= 0 ? '+' : ''}{regressionParams.predictor.coefficient.toFixed(2)} × {predictorName} (R² = {regressionParams.predictor.r2.toFixed(3)})
              </div>
            )}
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

                // Calculate predicted values
                const tempPredicted = regressionParams?.temp 
                  ? regressionParams.temp.intercept + regressionParams.temp.coefficient * data.x
                  : null;
                const predictorPredicted = regressionParams?.predictor && data.predictor_x != null
                  ? regressionParams.predictor.intercept + regressionParams.predictor.coefficient * data.predictor_x
                  : null;

                return (
                  <div className="bg-white p-2 border border-gray-200 rounded shadow">
                    <div className="space-y-1 text-sm">
                      <p className="text-[#2C5265]">Period: {new Date(data.begin_period).toLocaleDateString()} - {new Date(data.end_period).toLocaleDateString()}</p>
                      <p className="text-[#2C5265]">{formatTemp(selectedTemp)}: {data.x.toFixed(2)}</p>
                      {data.predictor_x != null && (
                        <p className="text-[#2C5265]">{predictorName}: {data.predictor_x.toFixed(2)}</p>
                      )}
                      <p className="text-[#2C5265]">Actual Usage: {data.y.toFixed(2)}</p>
                      {tempPredicted !== null && (
                        <p className="text-[#2C5265]">Predicted Usage (Temperature): {tempPredicted.toFixed(2)}</p>
                      )}
                      {predictorPredicted !== null && (
                        <p className="text-[#2C5265]">Predicted Usage ({predictorName}): {predictorPredicted.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Scatter
              data={chartData.map(point => ({ x: point.x, y: point.y }))}
              fill="#2C5265"
              shape="circle"
            />
            {regressionLineData.map((line, index) => (
              <Scatter
                key={line.type}
                data={line.points}
                legendType="none"
                fill={line.type === 'temp' ? '#AD435A' : '#4CAF50'}
                stroke={line.type === 'temp' ? '#AD435A' : '#4CAF50'}
                strokeWidth={2}
                line={true}
                shape={() => null}
                isAnimationActive={false}
              />
            ))}
          </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}