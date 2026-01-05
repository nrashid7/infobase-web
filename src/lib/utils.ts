import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely format any value for rendering in JSX.
 * Objects are stringified, primitives returned as strings.
 * Returns fallback for null/undefined.
 */
export function safeRender(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    // Handle common citation locator format
    if ('heading_path' in value && Array.isArray((value as Record<string, unknown>).heading_path)) {
      const hp = (value as Record<string, unknown>).heading_path as string[];
      return hp.join(' > ');
    }
    // Generic object fallback - never render [object Object]
    return '[structured data]';
  }
  return fallback;
}

/**
 * Format a citation locator for display.
 * Handles object locators like {type, heading_path, selector} and string locators.
 * Never renders [object Object].
 */
export function formatLocator(locator: unknown): string {
  if (!locator) return '';
  if (typeof locator === 'string') return locator;
  if (typeof locator === 'object' && locator !== null) {
    const loc = locator as Record<string, unknown>;
    const parts: string[] = [];
    
    // Join heading_path with " > "
    if (loc.heading_path && Array.isArray(loc.heading_path)) {
      parts.push((loc.heading_path as string[]).join(' > '));
    }
    
    // Add selector if present
    if (loc.selector && typeof loc.selector === 'string') {
      parts.push(loc.selector);
    }
    
    if (parts.length > 0) {
      return parts.join(' | ');
    }
    
    // Fallback for other object shapes
    if (typeof loc.type === 'string') return loc.type;
    return '[structured locator]';
  }
  return '';
}
