import { cn } from '@/lib/utils';
import { ClaimStatus } from '@/lib/kbStore';
import { CheckCircle, AlertCircle, Clock, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StatusBadgeProps {
  status: ClaimStatus | 'partial';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const statusConfig: Record<ClaimStatus | 'partial', { 
  label: string; 
  className: string;
  icon: React.ElementType;
  tooltip?: string;
}> = {
  verified: {
    label: 'Verified',
    className: 'status-verified',
    icon: CheckCircle,
  },
  unverified: {
    label: 'Not yet independently verified',
    className: 'status-unverified',
    icon: HelpCircle,
    tooltip: 'This information is taken directly from the official government website. Always verify before submitting an application.',
  },
  stale: {
    label: 'May be outdated',
    className: 'status-stale',
    icon: Clock,
    tooltip: 'This information may have changed. Please check the official website for the latest details.',
  },
  deprecated: {
    label: 'No longer current',
    className: 'status-deprecated',
    icon: XCircle,
    tooltip: 'This information is no longer applicable. Please check the official website.',
  },
  contradicted: {
    label: 'Under review',
    className: 'status-contradicted',
    icon: AlertTriangle,
    tooltip: 'We found conflicting information. Please verify on the official website.',
  },
  partial: {
    label: 'Partially verified',
    className: 'status-partial',
    icon: AlertCircle,
    tooltip: 'Some information has been verified, but not all. Please check details carefully.',
  },
};

export function StatusBadge({ status, size = 'sm', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const badge = (
    <span 
      className={cn(
        'status-badge',
        config.className,
        size === 'md' && 'px-3 py-1 text-sm'
      )}
    >
      {showIcon && <Icon className={cn('w-3 h-3', size === 'md' && 'w-4 h-4')} />}
      <span>{config.label}</span>
    </span>
  );

  // If there's a tooltip, wrap in tooltip component
  if (config.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-center">
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
