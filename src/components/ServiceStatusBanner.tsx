import { CheckCircle, AlertTriangle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { DerivedStatus } from '@/lib/kbStore';
import { cn } from '@/lib/utils';

interface ServiceStatusBannerProps {
  status: DerivedStatus;
  verifiedCount: number;
  totalCount: number;
  lastCrawled?: string | null;
  className?: string;
}

const STATUS_CONFIG: Record<DerivedStatus, {
  icon: React.ElementType;
  label: string;
  description: string;
  bgClass: string;
  iconClass: string;
}> = {
  verified: {
    icon: CheckCircle,
    label: 'Verified',
    description: 'All information has been independently verified.',
    bgClass: 'bg-status-verified/10 border-status-verified/30',
    iconClass: 'text-status-verified',
  },
  partial: {
    icon: AlertCircle,
    label: 'Partially verified',
    description: 'Some information has been verified, but not all.',
    bgClass: 'bg-amber-500/10 border-amber-500/30',
    iconClass: 'text-amber-500',
  },
  unverified: {
    icon: AlertTriangle,
    label: 'Not yet verified',
    description: 'This information has not been independently verified.',
    bgClass: 'bg-status-unverified/10 border-status-unverified/30',
    iconClass: 'text-status-unverified',
  },
  stale: {
    icon: Clock,
    label: 'May be outdated',
    description: 'The source content has changed since this was last verified.',
    bgClass: 'bg-status-stale/10 border-status-stale/30',
    iconClass: 'text-status-stale',
  },
  deprecated: {
    icon: XCircle,
    label: 'No longer current',
    description: 'This information is no longer accurate or relevant.',
    bgClass: 'bg-status-deprecated/10 border-status-deprecated/30',
    iconClass: 'text-status-deprecated',
  },
  contradicted: {
    icon: XCircle,
    label: 'Conflicting information',
    description: 'Different sources provide conflicting information.',
    bgClass: 'bg-destructive/10 border-destructive/30',
    iconClass: 'text-destructive',
  },
};

export function ServiceStatusBanner({ 
  status, 
  verifiedCount, 
  totalCount, 
  lastCrawled,
  className 
}: ServiceStatusBannerProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unverified;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-lg border",
      config.bgClass,
      className
    )}>
      <Icon className={cn("w-6 h-6 flex-shrink-0 mt-0.5", config.iconClass)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-foreground">{config.label}</p>
          <span className="text-sm text-muted-foreground">
            ({verifiedCount} of {totalCount} facts verified)
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        {lastCrawled && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {new Date(lastCrawled).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
