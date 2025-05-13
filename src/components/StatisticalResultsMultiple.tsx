import React from 'react';
import { BarChart3, HelpCircle, SwitchCamera } from 'lucide-react';
import { useDatasetContext } from '../context/DatasetContext';

interface TooltipProps {
  title: string;
  description: string;
  guidance: string;
}

function Tooltip({ title, description, guidance }: TooltipProps) {
  return (
    <div className="group relative flex items-center">
      <div className="font-medium text-[#2C5265]">{title}</div>
      <HelpCircle className="w-4 h-4 ml-2 text-[#7984A5]" />
      <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-72 p-3 bg-white rounded-lg shadow-lg text-sm z-10 pointer-events-none">
        <div className="font-medium text-[#2C5265] mb-2">{title}</div>
        <p className="text-[#2C5265] mb-2">{description}</p>
        <p className="text-[#7984A5] text-xs">What to look for: {guidance}</p>
      </div>
    </div>
  );
}

export function StatisticalResultsMultiple() {
  const { data } = useDatasetContext();
  const [showSimple, setShowSimple] = React.useState(false);

  const kind = data?.dataset?.metadata?.parameters?.kind;
  const multipleResults = kind === 'none'
    ? { none: data?.dataset?.regression_results?.multiple_regressions?.none }
    : (data?.dataset?.regression_results?.multiple_regressions || {});
  const simpleResults = kind === 'none'
    ? { none: data?.dataset?.regression_results?.simple_regressions?.none }
    : (data?.dataset?.regression_results?.simple_regressions || {});
  
  const regressionResults = showSimple ? simpleResults : multipleResults;
  const predictorName = data?.dataset?.metadata?.parameters?.predictors?.[0]?.name || 'Predictor 1';

  // Format column header
  const formatColumnHeader = (temp: string) => {
    if (showSimple) {
      if (temp === 'none') return predictorName;
      const match = temp.match(/(hdd|cdd)\(([^)]+)\)/i);
      if (!match) return temp;
      const [_, kind, baseTemp] = match;
      return `${kind.toUpperCase()}(${baseTemp})`;
    } else {
      if (temp === 'none') return predictorName;
      const match = temp.match(/(hdd|cdd)\(([^)]+)\)/i);
      if (!match) return temp;
      const [_, kind, baseTemp] = match;
      return `${kind.toUpperCase()}(${baseTemp}) & ${predictorName}`;
    }
  };

  // Format table rows based on regression type
  const getTableRows = () => {
    const commonRows = [
      {
        title: "Equation",
        description: "The formula that predicts energy usage based on degree days and predictor variables.",
        guidance: "Check if coefficients have expected signs and reasonable magnitudes.",
        getValue: (result: any) => formatEquation(result)
      },
      {
        title: "R²",
        description: "The proportion of variance in the dependent variable explained by the model.",
        guidance: "Higher values indicate better fit (range: 0 to 1).",
        getValue: (result: any) => !isNaN(result?.model_summary?.r_squared) ? result.model_summary.r_squared.toFixed(3) : 'N/A'
      },
      {
        title: "Adjusted R²",
        description: "R² adjusted for the number of predictors in the model.",
        guidance: "Prefer this over R² when comparing models with different numbers of predictors.",
        getValue: (result: any) => !isNaN(result?.model_summary?.adj_r_squared) ? result.model_summary.adj_r_squared.toFixed(3) : 'N/A'
      }
    ];

    const pValueRow = showSimple ? {
      title: "p-value",
      description: "Statistical significance of the coefficient.",
      guidance: "Values below 0.05 indicate statistical significance.",
      getValue: (result: any) => !isNaN(result?.coefficients?.[1]?.p_value) ? result.coefficients[1].p_value.toFixed(6) : 'N/A'
    } : [
      {
        title: "p-value (Degree Days)",
        description: "Statistical significance of the degree days coefficient.",
        guidance: "Values below 0.05 indicate statistical significance.",
        getValue: (result: any) => !isNaN(result?.coefficients?.[1]?.p_value) ? result.coefficients[1].p_value.toFixed(6) : 'N/A'
      },
      {
        title: `p-value (${predictorName})`,
        description: `Statistical significance of the ${predictorName} coefficient.`,
        guidance: "Values below 0.05 indicate statistical significance.",
        getValue: (result: any) => !isNaN(result?.coefficients?.[2]?.p_value) ? result.coefficients[2].p_value.toFixed(6) : 'N/A'
      }
    ];

    const remainingRows = [
      {
        title: "F-statistic",
        description: "Tests the overall significance of the regression model.",
        guidance: "Higher values indicate a stronger relationship between predictors and the dependent variable.",
        getValue: (result: any) => !isNaN(result?.model_summary?.f_statistic) ? result.model_summary.f_statistic.toFixed(2) : 'N/A'
      },
      {
        title: "Condition Number",
        description: "Measures the numerical stability of the model.",
        guidance: "Lower values indicate better stability. Values above 30 suggest potential issues.",
        getValue: (result: any) => !isNaN(result?.diagnostics?.condition_number) ? result.diagnostics.condition_number.toFixed(2) : 'N/A'
      },
      {
        title: "Observations",
        description: "Number of data points used in the analysis.",
        guidance: "More observations generally lead to more reliable results.",
        getValue: (result: any) => result?.model_summary?.observations || 'N/A'
      }
    ];

    return [...commonRows, ...(Array.isArray(pValueRow) ? pValueRow : [pValueRow]), ...remainingRows];
  };

  const formatEquation = (results: any) => {
    if (!results?.coefficients) return 'N/A';
    
    const intercept = results.coefficients[0]?.coef ?? 0;
    const degreeDay = results.coefficients[1]?.coef ?? 0;
    const degreeDayVar = showSimple && results.coefficients[1]?.variable === 'predictor_1' 
      ? predictorName 
      : results.coefficients[1]?.variable ?? 'Degree Days';
    
    if (showSimple) {
      return `${intercept.toFixed(2)} ${degreeDay >= 0 ? '+' : ''}${degreeDay.toFixed(2)} × ${degreeDayVar}`;
    } else {
      const predictor = results.coefficients[2]?.coef ?? 0;
      return `${intercept.toFixed(2)} ${degreeDay >= 0 ? '+' : ''}${degreeDay.toFixed(2)} × ${degreeDayVar} ${predictor >= 0 ? '+' : ''}${predictor.toFixed(2)} × ${predictorName}`;
    }
  };

  return (
    <div className="bg-[#f5f7f5] rounded-[25px] p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-6 h-6 text-[#2C5265]" />
        <div className="flex items-center justify-between w-full">
          <h2 className="text-2xl font-bold text-[#2C5265]">
            {showSimple ? 'Simple' : 'Multiple'} Regression Results
          </h2>
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
        <div className="bg-white rounded-[25px] p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[#2C5265] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Metric</th>
                {Object.keys(regressionResults).map(temp => (
                  <th key={temp} className="py-3 px-4 text-left font-semibold">
                    {formatColumnHeader(temp)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getTableRows().map((row, rowIndex) => (
                <tr key={row.title} className={rowIndex % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-4">
                    <Tooltip 
                      title={row.title}
                      description={row.description}
                      guidance={row.guidance}
                    />
                  </td>
                  {Object.values(regressionResults).map((result, index) => (
                    <td key={index} className={`py-2 px-4 ${row.title === 'Equation' ? 'font-mono text-sm' : ''}`}>
                      {row.getValue(result)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}