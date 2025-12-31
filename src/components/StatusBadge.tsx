import { cn } from '@/lib/utils';
import { ClaimStatus } from '@/lib/kbStore';
import { CheckCircle, AlertCircle, Clock, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ClaimStatus | 'partial';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const statusConfig: Record<ClaimStatus | 'partial', { 
  label: string; 
  className: string;
  icon: React.ElementType;
}> = {
  verified: {
    label: 'Verified',
    className: 'status-verified',
    icon: CheckCircle,
  },
  unverified: {
    label: 'Unverified',
    className: 'status-unverified',
    icon: HelpCircle,
  },
  stale: {
    label: 'Stale',
    className: 'status-stale',
    icon: Clock,
  },
  deprecated: {
    label: 'Deprecated',
    className: 'status-deprecated',
    icon: XCircle,
  },
  contradicted: {
    label: 'Contradicted',
    className: 'status-contradicted',
    icon: AlertTriangle,
  },
  partial: {
    label: 'Partial',
    className: 'status-partial',
    icon: AlertCircle,
  },
};

export function StatusBadge({ status, size = 'sm', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
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
}
