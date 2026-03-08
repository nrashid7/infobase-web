

## Deploy Updated Edge Functions

All four edge functions are registered in `config.toml` and their code is present. To ensure the deployed versions match the latest codebase from the Cursor push, I will redeploy all four:

1. **`scrape-gov-site`** — Multi-strategy scraper (Firecrawl extract → scrape + direct fetch + Gemini fallback). 582 lines. Uses `Deno.serve`, Firecrawl API, Lovable AI gateway, Supabase service role client.

2. **`research-guide`** — Guide researcher with auth verification, Firecrawl portal crawling, and Gemini synthesis. 554 lines. Requires authenticated user (checks via `supabase.auth.getUser`).

3. **`ask`** — AI Q&A with streaming, bilingual support (EN/BN), input validation. 159 lines. Uses Lovable AI gateway with `gemini-2.5-flash`.

4. **`validate-url`** — URL validator with content matching, SSL fallback, HTTP fallback, concurrent checking. Uses `serve` from std.

### Action
Deploy all four functions in one step. No code changes needed — just triggering deployment.

