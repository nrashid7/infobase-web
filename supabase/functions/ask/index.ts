import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:8080') return true;
  if (origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : 'https://infobase.lovable.app',
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// Input validation constants
const MAX_QUESTION_LENGTH = 1000;
const MAX_CONTEXT_LENGTH = 50000;
const ALLOWED_LANGUAGES = ['en', 'bn'];

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { question, context, language = 'en' } = body;
    
    // Validate question - required and must be a string
    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate question length
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      return new Response(
        JSON.stringify({ error: "Question cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Question is too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate language parameter
    const validLanguage = ALLOWED_LANGUAGES.includes(language) ? language : 'en';

    // Validate context if provided
    let validContext = '';
    if (context) {
      if (typeof context !== 'string') {
        return new Response(
          JSON.stringify({ error: "Invalid context format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (context.length > MAX_CONTEXT_LENGTH) {
        validContext = context.substring(0, MAX_CONTEXT_LENGTH);
      } else {
        validContext = context;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const languageInstruction = validLanguage === 'bn' 
      ? `IMPORTANT: The user is using Bengali. You MUST respond entirely in Bengali (বাংলা). Use Bengali script for your entire response.`
      : `Respond in English.`;

    const systemPrompt = `You are a helpful assistant for INFOBASE, a knowledge base about Bangladesh government services.

${languageInstruction}

You have TWO data sources:
1. **Service Guides** — detailed how-to guides for government services (passport, NID, driving license, etc.)
2. **Government Directory** — 500+ official government websites organized by ministry/category

Guidelines:
- Be concise and helpful
- If you don't know, say so clearly
- Always recommend verifying on official government portals
- Focus on practical, actionable information
- Use simple language accessible to all users
- When your answer relates to a service guide, include a markdown link: [Guide Title](/guides/GUIDE_ID). Example: [e-Passport Application Guide](/guides/guide.epassport)
- When your answer relates to a government website from the directory, include a markdown link to its page on INFOBASE: [Site Name](/directory/SLUG). Example: [Ministry of Finance](/directory/mof-gov-bd). Also mention the official URL.
- You may reference multiple guides and directory entries in a single response
- If a user asks about a specific ministry, department, or agency, check the directory data and provide the official website URL and a link to the INFOBASE directory page

${validContext ? `${validContext}` : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: trimmedQuestion },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get answer" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask error:", e);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
