import { Shield, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface VerifiedOnlyToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function VerifiedOnlyToggle({ checked, onCheckedChange, className }: VerifiedOnlyToggleProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        {checked ? (
          <ShieldCheck className="w-4 h-4 text-status-verified" />
        ) : (
          <Shield className="w-4 h-4 text-muted-foreground" />
        )}
        <Label htmlFor="verified-only" className="text-sm cursor-pointer">
          Show only verified
        </Label>
      </div>
      <Switch
        id="verified-only"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
