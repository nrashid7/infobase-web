import { forwardRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export const Footer = forwardRef<HTMLElement>(function Footer(props, ref) {
  const { t } = useLanguage();

  return (
    <footer ref={ref} className="mt-auto border-t border-border bg-muted/20" {...props}>
      <div className="container py-8 text-center space-y-5">
        {/* Brand + tagline */}
        <div>
          <p className="text-sm font-semibold tracking-wide text-foreground">INFOBASE</p>
          <p className="text-xs text-muted-foreground mt-1">{t('footer.tagline')}</p>
        </div>

        {/* Compact disclaimer */}
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 justify-center">
          <AlertTriangle className="w-3 h-3 text-status-stale flex-shrink-0" />
          {t('footer.disclaimer.text')}
        </p>
      </div>
    </footer>
  );
});
