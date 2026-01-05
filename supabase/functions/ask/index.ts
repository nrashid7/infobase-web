import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_QUESTION_LENGTH = 1000;
const MAX_CONTEXT_LENGTH = 10000;
const ALLOWED_LANGUAGES = ['en', 'bn'];

serve(async (req) => {
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
        // Truncate context rather than reject - this allows graceful degradation
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

Your role is to answer questions about government services like:
- e-Passport applications
- National ID (NID) services
- Driving license from BRTA
- Vehicle registration and fitness certificates
- Tax tokens

Guidelines:
- Be concise and helpful
- If you don't know, say so clearly
- Always recommend verifying on official government portals
- Focus on practical, actionable information
- Use simple language accessible to all users

${validContext ? `Here is some context about available services:\n${validContext}` : ''}`;

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
    // Log detailed error server-side only
    console.error("ask error:", e);
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
