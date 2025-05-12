import React from 'react';
import { BarChart3, HelpCircle } from 'lucide-react';
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

export function StatisticalResults() {
  const { data } = useDatasetContext();

  const kind = data?.dataset?.metadata?.parameters?.kind;
  const regressionResults = kind === 'none' 
    ? { none: data?.dataset?.regression_results?.none }
    : (data?.dataset?.regression_results || {});

  const formatEquation = (results: any) => {
    if (!results?.coefficients) return 'N/A';
    
    const intercept = results.coefficients[0].coef;
    const coefficient = results.coefficients[1].coef;
    const variable = results.coefficients[1].variable;
    
    return `${intercept.toFixed(2)} ${coefficient >= 0 ? '+' : ''}${coefficient.toFixed(2)} × ${variable}`;
  };

  return (
    <div className="bg-[#f5f7f5] rounded-[25px] p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-6 h-6 text-[#2C5265]" />
        <h2 className="text-2xl font-bold text-[#2C5265]">Statistical Results</h2>
      </div>
      <div className="space-y-4">
        <div className="bg-white rounded-[25px] p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[#2C5265] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Description</th>
                {Object.keys(regressionResults).map(temp => (
                  <th key={temp} className="py-3 px-4 text-left font-semibold">{temp}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 px-4">
                  <Tooltip 
                    title="Equation"
                    description="The formula that predicts energy usage based on degree days (DD). It consists of an intercept (baseline usage) and a coefficient (effect of DD)."
                    guidance="For heating degree days (HDD), it's usually negative (more HDD → lower usage for cooling). For cooling degree days (CDD), it's usually positive (more CDD → higher usage). Unexpected signs may indicate data issues."
                  />
                </td>
                {Object.values(regressionResults).map((result, index) => (
                  <td key={index} className="py-2 px-4 font-mono text-sm">
                    {formatEquation(result)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4">
                  <Tooltip 
                    title="R²"
                    description="Measures how well degree days explain variations in energy usage."
                    guidance="Higher is better (ranges from 0 to 1). A low R² means degree days alone don't explain much of the variation in usage, suggesting other factors are at play."
                  />
                </td>
                {Object.values(regressionResults).map((result, index) => (
                  <td key={index} className="py-2 px-4">
                    {result?.model_summary?.r_squared?.toFixed(3) || 'N/A'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-4">
                  <Tooltip 
                    title="p-value"
                    description="Tests whether degree days have a statistically significant impact on usage. A low p-value means the effect is meaningful."
                    guidance="Lower is better (below 0.05 is typically significant). A high p-value suggests degree days may not be a strong predictor on their own."
                  />
                </td>
                {Object.values(regressionResults).map((result, index) => (
                  <td key={index} className="py-2 px-4">
                    {result?.coefficients?.[1]?.p_value?.toExponential(2) || 'N/A'}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4">
                  <Tooltip 
                    title="F-statistic"
                    description="Measures the overall significance of the regression model."
                    guidance="Higher is better. A low F-statistic suggests the model might not be useful for predicting usage."
                  />
                </td>
                {Object.values(regressionResults).map((result, index) => (
                  <td key={index} className="py-2 px-4">
                    {result?.model_summary?.f_statistic?.toFixed(2) || 'N/A'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-4">
                  <Tooltip 
                    title="p-value of F-statistic"
                    description="Tests if the regression model as a whole is statistically significant."
                    guidance="Lower is better (below 0.05 means the model is significant)."
                  />
                </td>
                {Object.values(regressionResults).map((result, index) => (
                  <td key={index} className="py-2 px-4">
                    {result?.model_summary?.prob_f_statistic || 'N/A'}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4">
                  <Tooltip 
                    title="Condition Number"
                    description="Checks for multicollinearity (high correlation between input variables). High values indicate instability in the model."
                    guidance="Lower is better (above 30 suggests multicollinearity issues, which can affect coefficient reliability)."
                  />
                </td>
                {Object.values(regressionResults).map((result, index) => (
                  <td key={index} className="py-2 px-4">
                    {result?.diagnostics?.condition_number?.toFixed(2) || 'N/A'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 px-4">
                  <Tooltip 
                    title="Observations Count"
                    description="The number of data points used in the regression analysis. More data typically improves reliability."
                    guidance="Higher is better. Small sample sizes can lead to unreliable or misleading results."
                  />
                </td>
                {Object.values(regressionResults).map((result, index) => (
                  <td key={index} className="py-2 px-4">
                    {result?.model_summary?.observations || 'N/A'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}