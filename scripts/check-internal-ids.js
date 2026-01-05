#!/usr/bin/env node
/**
 * Build-time check to ensure no internal IDs are rendered in UI
 * Fails if any patterns like "claim." are found in component files
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_PATTERNS = [
  /["']claim\./g,  // "claim. or 'claim.
  /{.*claim_id.*}/g, // {claim_id} or similar JSX interpolation
  /{.*source_page_id.*}/g, // source_page_id in JSX
  /\bguide_id\b(?=.*[>{])/g, // guide_id being rendered
  /\bservice_id\b(?=.*[>{])/g, // service_id being rendered
];

const EXEMPT_FILES = [
  'guidesStore.ts', // Data layer needs IDs for lookups
  'check-internal-ids.js', // This file itself
];

const SCAN_EXTENSIONS = ['.tsx', '.jsx'];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  
  if (EXEMPT_FILES.includes(fileName)) {
    return [];
  }
  
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, lineNum) => {
    // Skip imports and type definitions
    if (line.trim().startsWith('import ') || 
        line.trim().startsWith('export type') ||
        line.trim().startsWith('export interface') ||
        line.includes('// eslint-disable')) {
      return;
    }
    
    FORBIDDEN_PATTERNS.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        issues.push({
          file: filePath,
          line: lineNum + 1,
          match: matches[0],
          content: line.trim()
        });
      }
    });
  });
  
  return issues;
}

function walkDir(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        walkDir(fullPath, files);
      }
    } else if (SCAN_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main
const srcDir = path.join(__dirname, '..', 'src');
const files = walkDir(srcDir);
let allIssues = [];

for (const file of files) {
  const issues = scanFile(file);
  allIssues = allIssues.concat(issues);
}

if (allIssues.length > 0) {
  console.error('\n❌ Internal ID guardrail check FAILED!\n');
  console.error('The following files contain potential internal ID exposure:\n');
  
  allIssues.forEach(issue => {
    console.error(`  ${issue.file}:${issue.line}`);
    console.error(`    Pattern: ${issue.match}`);
    console.error(`    Line: ${issue.content}\n`);
  });
  
  console.error('Fix: Use human-readable labels instead of internal IDs in UI.\n');
  process.exit(1);
}

console.log('✅ Internal ID guardrail check passed - no internal IDs in UI');
process.exit(0);
