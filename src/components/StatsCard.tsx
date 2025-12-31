import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, className }: StatsCardProps) {
  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow",
      className
    )}>
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
