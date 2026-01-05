import { forwardRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export const Footer = forwardRef<HTMLElement>(function Footer(props, ref) {
  const { t } = useLanguage();

  return (
    <footer ref={ref} className="mt-auto border-t border-border bg-muted/20" {...props}>
      <div className="container py-6">
        <div className="flex items-start gap-3 p-4 bg-status-stale-bg/40 rounded-xl border border-status-stale/15">
          <AlertTriangle className="w-4 h-4 text-status-stale flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">{t('footer.disclaimer.title')}</p>
            <p className="text-muted-foreground mt-1">
              {t('footer.disclaimer.text')}
            </p>
          </div>
        </div>
        <div className="mt-5 text-center text-sm text-muted-foreground">
          {t('footer.version')}
        </div>
      </div>
    </footer>
  );
});