import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

interface ScrapeStatusBadgeProps {
  status: 'success' | 'pending' | 'failed' | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ScrapeStatusBadge({ status, size = 'sm', showLabel = false }: ScrapeStatusBadgeProps) {
  const { language } = useLanguage();

  const config = {
    success: {
      icon: CheckCircle,
      label: language === 'bn' ? 'তথ্য আছে' : 'Info available',
      className: 'text-status-verified bg-status-verified-bg',
    },
    pending: {
      icon: Clock,
      label: language === 'bn' ? 'অপেক্ষমাণ' : 'Pending',
      className: 'text-muted-foreground bg-muted',
    },
    failed: {
      icon: AlertCircle,
      label: language === 'bn' ? 'ব্যর্থ' : 'Failed',
      className: 'text-status-stale bg-status-stale-bg',
    },
  };

  if (!status) return null;

  const { icon: Icon, label, className } = config[status];
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (!showLabel) {
    return (
      <div 
        className={cn('rounded-full p-1', className)} 
        title={label}
      >
        <Icon className={iconSize} />
      </div>
    );
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
      className
    )}>
      <Icon className={iconSize} />
      <span>{label}</span>
    </div>
  );
}
