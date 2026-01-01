import { cn } from '@/lib/utils';

export type ApplicationType = 'regular' | 'express' | 'super_express';

interface ApplicationTypeSelectorProps {
  types: ApplicationType[];
  selected: ApplicationType;
  onChange: (type: ApplicationType) => void;
}

const TYPE_LABELS: Record<ApplicationType, string> = {
  regular: 'Regular',
  express: 'Express',
  super_express: 'Super Express',
};

const TYPE_DESCRIPTIONS: Record<ApplicationType, string> = {
  regular: 'Standard processing time',
  express: 'Faster delivery',
  super_express: 'Fastest option',
};

export function ApplicationTypeSelector({ types, selected, onChange }: ApplicationTypeSelectorProps) {
  if (types.length <= 1) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-8">
      <h3 className="text-sm font-medium text-foreground mb-3">Choose application type</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-all",
              selected === type
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <span className="font-medium text-foreground block">{TYPE_LABELS[type]}</span>
            <span className="text-xs text-muted-foreground">{TYPE_DESCRIPTIONS[type]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Detect application types from fee claims
export function detectApplicationTypes(claims: { text: string }[]): ApplicationType[] {
  const types: Set<ApplicationType> = new Set();
  
  claims.forEach(claim => {
    const text = claim.text.toLowerCase();
    if (text.includes('super express') || text.includes('super-express')) {
      types.add('super_express');
    }
    if (text.includes('express') && !text.includes('super')) {
      types.add('express');
    }
    if (text.includes('regular') || text.includes('normal')) {
      types.add('regular');
    }
  });
  
  // If no types detected, default to regular
  if (types.size === 0) {
    types.add('regular');
  }
  
  // Sort in order: regular, express, super_express
  const order: ApplicationType[] = ['regular', 'express', 'super_express'];
  return order.filter(t => types.has(t));
}
