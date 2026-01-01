import { NormalizedCategory, NormalizedClaim } from './kbStore';

// Citizen-friendly category labels for claim titles
export const CITIZEN_CATEGORY_TITLES: Record<NormalizedCategory, string> = {
  eligibility: 'Who can apply',
  fees: 'Fee',
  required_documents: 'Documents required',
  processing_time: 'Processing time',
  application_steps: 'How to apply',
  portal_links: 'Apply online',
  service_info: 'General information',
};

// Generate a human-readable title for a claim
export function generateClaimTitle(claim: NormalizedClaim): string {
  // If summary exists, use it (it should be human-readable)
  if (claim.summary) {
    return claim.summary;
  }
  
  // Generate from category and text
  const categoryTitle = CITIZEN_CATEGORY_TITLES[claim.category] || 'Information';
  
  // For fees, try to extract context from text
  if (claim.category === 'fees') {
    // Look for patterns like "48 pages", "Regular", etc.
    const pageMatch = claim.text.match(/(\d+)\s*pages?/i);
    const typeMatch = claim.text.match(/(regular|urgent|express|emergency)/i);
    
    if (pageMatch || typeMatch) {
      const parts: string[] = [];
      if (pageMatch) parts.push(`${pageMatch[1]} pages`);
      if (typeMatch) parts.push(typeMatch[1].charAt(0).toUpperCase() + typeMatch[1].slice(1).toLowerCase());
      return `${categoryTitle} (${parts.join(' – ')})`;
    }
  }
  
  // For processing time, make it descriptive
  if (claim.category === 'processing_time') {
    return 'Processing time';
  }
  
  // For application steps, use friendly title
  if (claim.category === 'application_steps') {
    return 'How to apply';
  }
  
  // For documents, make it clear
  if (claim.category === 'required_documents') {
    return 'Documents required';
  }
  
  return categoryTitle;
}
