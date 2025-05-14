import React, { useState, useEffect } from 'react';
import { LineChart } from 'lucide-react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js';
import { useDatasetContext } from '../context/DatasetContext';
import { useRegressionType } from '../context/RegressionTypeContext';

const Plot = createPlotlyComponent(Plotly);

export function SimpleRegressionGraph() {
  const { data } = useDatasetContext();
  const { showSimple } = useRegressionType();
  const [selectedTemp, setSelectedTemp] = useState<string>('');
  const [equation, setEquation] = useState<string>('');

  const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';
  const kind = data?.dataset?.metadata?.parameters?.kind;
  const predictors = data?.dataset?.metadata?.parameters?.predictors || [];
  const isPredictor = kind === 'none' && data?.dataset?.metadata?.parameters?.predictors && predictors.length === 1;

  // Create 3D data for multiple regression
  const create3DData = () => {
    if (!data?.dataset?.usage_data || !selectedTemp) return null;

    const points = data.dataset.usage_data
      .filter(entry => 
        typeof entry[selectedTemp] === 'number' && 
        !isNaN(entry[selectedTemp]) &&
        typeof entry.usage === 'number' && 
        !isNaN(entry.usage) &&
        typeof entry.predictor_1 === 'number' && 
        !isNaN(entry.predictor_1)
      );

    if (points.length === 0) return null;

    // Create scatter data
    const scatter = {
      type: 'scatter3d',
      mode: 'markers',
      name: 'Data Points',
      x: points.map(p => p[selectedTemp]),
      y: points.map(p => p.predictor_1),
      z: points.map(p => p.usage),
      marker: {
        size: 5,
        color: '#2C5265',
        opacity: 0.8
      }
    };

    // Create regression surface
    const results = data?.dataset?.regression_results?.multiple_regressions?.[`${selectedTemp}_${predictorName}`];
    if (!results?.coefficients) return [scatter];

    const intercept = results.coefficients[0]?.coef ?? 0;
    const ddCoef = results.coefficients[1]?.coef ?? 0;
    const predCoef = results.coefficients[2]?.coef ?? 0;

    // Create grid for surface
    const xRange = points.map(p => p[selectedTemp]);
    const yRange = points.map(p => p.predictor_1);
    const xMin = Math.min(...xRange);
    const xMax = Math.max(...xRange);
    const yMin = Math.min(...yRange);
    const yMax = Math.max(...yRange);

    const xGrid = Array.from({ length: 20 }, (_, i) => xMin + (xMax - xMin) * i / 19);
    const yGrid = Array.from({ length: 20 }, (_, i) => yMin + (yMax - yMin) * i / 19);

    const zGrid = xGrid.map(x => 
      yGrid.map(y => intercept + ddCoef * x + predCoef * y)
    );

    const surface = {
      type: 'surface',
      x: xGrid,
      y: yGrid,
      z: zGrid,
      colorscale: [
        [0, '#AD435A'],
        [1, '#AD435A']
      ],
      opacity: 0.7,
      showscale: false,
      name: 'Regression Surface'
    };

    return [scatter, surface];
  };

  // Get the first available temperature on component mount
  useEffect(() => {
    if (!data?.dataset?.usage_data?.[0]) return;
    
    const temps = data?.dataset?.usage_data && Object.keys(data.dataset.usage_data[0])
      .filter(key => key.match(/^(cdd|hdd)\(\d+(?:\.\d+)?\)$/i))
      .sort();
    
    if (temps && temps.length > 0) {
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

    return validPoints;
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
        {!isPredictor && data?.dataset?.usage_data?.[0] && <div className="flex gap-2">
          {Object.keys(data.dataset.usage_data[0])
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
        </div>}
      </div>
      
      <div className="bg-white rounded-[25px] p-6">
        {equation && showSimple && (
          <div className="mb-4 space-y-1 text-sm text-[#2C5265] font-mono">
            {equation}
          </div>
        )}
        <div className="h-[500px]">
          {showSimple ? (
            <Plot
              data={[
                {
                  type: 'scatter',
                  mode: 'markers',
                  x: chartData.map(point => point.x),
                  y: chartData.map(point => point.y),
                  marker: { color: '#2C5265' },
                  name: 'Data Points'
                },
                {
                  type: 'scatter',
                  mode: 'lines',
                  x: regressionLineData.map(point => point.x),
                  y: regressionLineData.map(point => point.y),
                  line: { color: '#AD435A' },
                  name: 'Regression Line'
                }
              ]}
              layout={{
                autosize: true,
                margin: { l: 50, r: 50, t: 30, b: 50 },
                showlegend: false,
                xaxis: {
                  title: isPredictor ? predictorName : formatTemp(selectedTemp)
                },
                yaxis: {
                  title: 'Usage'
                }
              }}
              config={{
                displayModeBar: false,
                responsive: true
              }}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Plot
              data={create3DData() || []}
              layout={{
                autosize: true,
                margin: { l: 0, r: 0, t: 30, b: 0 },
                showlegend: false,
                scene: {
                  xaxis: {
                    title: formatTemp(selectedTemp)
                  },
                  yaxis: {
                    title: predictorName
                  },
                  zaxis: {
                    title: 'Usage'
                  },
                  camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.5 }
                  }
                }
              }}
              config={{
                displayModeBar: true,
                responsive: true
              }}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}