-- Fix overly permissive RLS policy: restrict write access to service_role only
-- The previous policy allowed any user (including anon) to INSERT/UPDATE/DELETE

DROP POLICY IF EXISTS "Service role can manage gov site details" ON public.gov_site_details;

CREATE POLICY "Service role can manage gov site details"
ON public.gov_site_details
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
