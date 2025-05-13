import React, { useEffect, useState } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useDatasetContext } from '../context/DatasetContext';
import { getInterpretation } from '../lib/supabase';

export function ResultsInterpretation() {
  const { data } = useDatasetContext();
  const [interpretation, setInterpretation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInterpretation = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        parameters: data?.dataset?.metadata?.parameters,
        regression_results: {
          multiple_regressions: data?.dataset?.metadata?.parameters?.kind === 'none'
            ? { none: data?.dataset?.regression_results?.multiple_regressions?.none }
            : data?.dataset?.regression_results?.multiple_regressions
        }
      };

      if (!payload.parameters || !payload.regression_results.multiple_regressions) {
        throw new Error('No regression results available');
      }

      const result = await getInterpretation(payload);
      setInterpretation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate interpretation');
      console.error('Error generating interpretation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data?.dataset?.regression_results) {
      generateInterpretation();
    }
  }, [data?.dataset?.regression_results, data]);

  return (
    <div className="bg-[#f5f7f5] rounded-[25px] p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-[#2C5265]" />
          <h2 className="text-2xl font-bold text-[#2C5265]">Results Interpretation (AI powered)</h2>
        </div>
        <button
          onClick={generateInterpretation}
          disabled={loading}
          className="text-[#2C5265] hover:text-[#2C5265]/70 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Regenerate interpretation"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="bg-white rounded-[25px] p-6">
        {loading ? (
          <div className="flex items-center justify-center text-[#7984A5]">
            Generating interpretation...
          </div>
        ) : error ? (
          <div className="text-[#AD435A]">
            Error: {error}
          </div>
        ) : interpretation ? (
          <div className="prose text-[#1D131E] max-w-none">
            {interpretation.split('\n').map((paragraph, index) => {
              // Handle ### headings
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-xl font-bold text-[#2C5265] mb-4">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              // Handle ## headings
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-2xl font-bold text-[#2C5265] mb-4">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              // Handle **bold** text
              const formattedText = paragraph.replace(
                /\*\*(.*?)\*\*/g,
                '<strong>$1</strong>'
              ).replace(
                /\$R\^2\$/g,
                'R²'
              );
              return (
                <p 
                  key={index} 
                  className="mb-4 last:mb-0"
                  dangerouslySetInnerHTML={{ __html: formattedText }}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-[#7984A5] text-center">
            No interpretation available
          </div>
        )}
      </div>
    </div>
  );
}