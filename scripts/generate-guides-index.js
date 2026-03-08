#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'is', 'it',
  'of', 'on', 'or', 'the', 'to', 'with',
]);

function deriveKeywords(title, agencyName) {
  const combined = `${title} ${agencyName}`;
  const tokens = combined
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
  return [...new Set(tokens)];
}

const guidesPath = resolve(__dirname, '../src/data/public_guides.json');
const outputPath = resolve(__dirname, '../src/data/public_guides_index.json');

const guidesData = JSON.parse(readFileSync(guidesPath, 'utf-8'));

const entries = guidesData.guides.map(g => ({
  guide_id: g.guide_id,
  service_id: g.service_id,
  agency_id: g.agency_id,
  title: g.title,
  agency_name: g.agency_name,
  keywords: deriveKeywords(g.title, g.agency_name),
  step_count: g.meta?.total_steps ?? (g.steps?.length ?? 0),
  citation_count: g.meta?.total_citations ?? 0,
  status: g.meta?.status ?? 'draft',
}));

const index = {
  $schema_version: guidesData.$schema_version || '3.0.0',
  generated_at: new Date().toISOString(),
  source_kb_version: guidesData.source_kb_version || 47,
  entries,
};

writeFileSync(outputPath, JSON.stringify(index, null, 2) + '\n');
console.log(`Generated ${outputPath} with ${entries.length} entries`);
