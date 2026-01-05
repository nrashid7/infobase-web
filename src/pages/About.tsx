import { FileText, AlertTriangle, ExternalLink, Shield, Mail } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="py-8 px-4">
      <div className="container max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('about.title')}</h1>
          <p className="text-muted-foreground">
            {t('about.subtitle')}
          </p>
        </header>

        <div className="space-y-8">
          {/* What is INFOBASE */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">{t('about.whatIs.title')}</h2>
                <p className="text-muted-foreground">
                  {t('about.whatIs.desc')}
                </p>
              </div>
            </div>
          </section>

          {/* How we work */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">{t('about.howWeWork.title')}</h2>
                <ul className="text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {t('about.howWeWork.item1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {t('about.howWeWork.item2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {t('about.howWeWork.item3')}
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="bg-status-stale-bg border border-status-stale/30 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-status-stale/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-status-stale" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">{t('about.disclaimer.title')}</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    {t('about.disclaimer.p1')}
                  </p>
                  <p>
                    <strong>{t('about.disclaimer.p2')}</strong>
                  </p>
                  <p>
                    {t('about.disclaimer.p3')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Official Resources */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">{t('about.resources.title')}</h2>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="https://www.epassport.gov.bd" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Bangladesh e-Passport Portal
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://nidw.gov.bd" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      National ID Wing
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://brta.gov.bd" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      BRTA (Road Transport Authority)
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">{t('about.contact.title')}</h2>
                <p className="text-muted-foreground mb-3">
                  {t('about.contact.desc')}
                </p>
                <a 
                  href="mailto:hello@infobase.gov.bd"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  hello@infobase.gov.bd
                  <Mail className="w-3 h-3" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
