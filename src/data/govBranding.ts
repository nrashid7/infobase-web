// Government department branding colors and metadata
// Used as fallback when scraping doesn't extract branding data

export interface DepartmentBranding {
  primaryColor: string;
  secondaryColor?: string;
  icon?: string;
}

// Category-based branding defaults
export const categoryBranding: Record<string, DepartmentBranding> = {
  'core-government': {
    primaryColor: '#006a4e', // Bangladesh flag green
    secondaryColor: '#f42a41', // Bangladesh flag red
  },
  'key-ministries': {
    primaryColor: '#1e3a5f', // Deep blue for authority
    secondaryColor: '#006a4e',
  },
  'public-services': {
    primaryColor: '#0284c7', // Accessible blue
    secondaryColor: '#0369a1',
  },
  'e-governance': {
    primaryColor: '#059669', // Tech green
    secondaryColor: '#10b981',
  },
  'law-judiciary': {
    primaryColor: '#1e3a5f', // Traditional navy
    secondaryColor: '#d4af37', // Gold accent
  },
  'economic-institutions': {
    primaryColor: '#0f766e', // Financial teal
    secondaryColor: '#14b8a6',
  },
  'education-research': {
    primaryColor: '#7c3aed', // Academic purple
    secondaryColor: '#8b5cf6',
  },
  'health-services': {
    primaryColor: '#0891b2', // Medical cyan
    secondaryColor: '#06b6d4',
  },
  'agriculture-environment': {
    primaryColor: '#16a34a', // Natural green
    secondaryColor: '#22c55e',
  },
  'energy-utilities': {
    primaryColor: '#ea580c', // Energy orange
    secondaryColor: '#f97316',
  },
  'transport-infrastructure': {
    primaryColor: '#475569', // Infrastructure slate
    secondaryColor: '#64748b',
  },
  'communication-it': {
    primaryColor: '#6366f1', // Tech indigo
    secondaryColor: '#818cf8',
  },
  'local-government': {
    primaryColor: '#0d9488', // Civic teal
    secondaryColor: '#14b8a6',
  },
  'additional-ministries': {
    primaryColor: '#4f46e5', // Ministerial indigo
    secondaryColor: '#6366f1',
  },
  'social-services': {
    primaryColor: '#db2777', // Social magenta
    secondaryColor: '#ec4899',
  },
  'planning-development': {
    primaryColor: '#0284c7', // Planning blue
    secondaryColor: '#0ea5e9',
  },
  'security-defense': {
    primaryColor: '#3f6212', // Military olive
    secondaryColor: '#65a30d',
  },
  'regulatory-commissions': {
    primaryColor: '#7c2d12', // Authoritative brown
    secondaryColor: '#c2410c',
  },
  'disaster-emergency': {
    primaryColor: '#dc2626', // Emergency red
    secondaryColor: '#ef4444',
  },
  'maritime-ports': {
    primaryColor: '#0369a1', // Maritime blue
    secondaryColor: '#0284c7',
  },
  'administrative-directory': {
    primaryColor: '#6366f1', // Directory indigo
    secondaryColor: '#818cf8',
  },
};

// Get branding for a category
export function getCategoryBranding(categoryId: string): DepartmentBranding {
  return categoryBranding[categoryId] || {
    primaryColor: '#006a4e', // Default to Bangladesh flag green
    secondaryColor: '#f42a41',
  };
}

// Placeholder contact info values to filter out
export const invalidContactPatterns = [
  'not provided',
  'not available',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  '-',
  '--',
  '...',
  'contact us',
  'coming soon',
  'to be updated',
  'under construction',
];

// Check if a contact value is valid (not a placeholder)
export function isValidContactValue(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  if (normalized.length < 3) return false;
  return !invalidContactPatterns.some(pattern => normalized.includes(pattern));
}

// Validate phone number format
export function isValidPhone(phone: string): boolean {
  if (!isValidContactValue(phone)) return false;
  // Should contain digits and common phone characters
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 6;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  if (!isValidContactValue(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Clean and format phone number for display
export function formatPhoneDisplay(phone: string): string {
  // Remove multiple spaces and normalize
  return phone.replace(/\s+/g, ' ').trim();
}

// Clean and format address for display
export function formatAddressDisplay(address: string): string {
  // Remove multiple spaces and normalize line breaks
  return address
    .replace(/\s+/g, ' ')
    .replace(/,\s*/g, ', ')
    .trim();
}
