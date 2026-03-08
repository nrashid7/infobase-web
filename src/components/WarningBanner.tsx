import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarningBannerProps {
  title?: string;
  message: string;
  className?: string;
}

export function WarningBanner({ 
  title = "Information may be incomplete or outdated",
  message,
  className 
}: WarningBannerProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border",
      "bg-status-stale-bg border-status-stale/30",
      className
    )}>
      <AlertTriangle className="w-5 h-5 text-status-stale flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
    </div>
  );
}
