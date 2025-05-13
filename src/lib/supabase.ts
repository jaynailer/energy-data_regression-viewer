import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

interface InterpretationPayload {
  parameters: any;
  regression_results: {
    multiple_regressions: any;
  };
}

export async function getInterpretation(payload: InterpretationPayload): Promise<string> {
  try {
    const response = await fetch('https://energydata.app.n8n.cloud/webhook/17b72dac-f9e1-4f9c-9587-b25b561e93db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to get interpretation');
    }

    const data = await response.text();
    return data || 'No interpretation available';
  } catch (error) {
    throw new Error(`Failed to get interpretation: ${error.message}`);
  }
}