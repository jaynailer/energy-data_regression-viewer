import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { load } from "https://deno.land/std@0.204.0/dotenv/mod.ts"

// Load environment variables
const env = await load()
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY') || env['PERPLEXITY_API_KEY']
if (!PERPLEXITY_API_KEY) {
  throw new Error('PERPLEXITY_API_KEY is required')
}

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

// Updated CORS headers to allow specific origin
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://energy-data.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight
}

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: Message[]
  model?: string
  max_tokens?: number
  temperature?: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, // No content for OPTIONS
      headers: corsHeaders 
    })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const { messages, model = 'mistral-7b-instruct', max_tokens = 1000, temperature = 0.7 } = await req.json() as ChatRequest

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format')
    }

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Perplexity API error: ${error}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})