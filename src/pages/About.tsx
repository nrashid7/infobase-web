import { FileText, AlertTriangle, ExternalLink, Shield, Mail, HelpCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function About() {
  const { t, language } = useLanguage();

  const faqs = [
    { q: t('about.faq.q1'), a: t('about.faq.a1') },
    { q: t('about.faq.q2'), a: t('about.faq.a2') },
    { q: t('about.faq.q3'), a: t('about.faq.a3') },
  ];

  return (
    <div className="py-10 px-4">
      <div className="container max-w-3xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-3">{t('about.title')}</h1>
          <p className="text-lg text-muted-foreground">
            {t('about.subtitle')}
          </p>
        </header>

        <div className="space-y-6">
          {/* What is INFOBASE */}
          <section className="modern-card p-6">
            <div className="flex items-start gap-4">
              <div className="icon-container flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">{t('about.whatIs.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('about.whatIs.desc')}
                </p>
              </div>
            </div>
          </section>

          {/* How we work */}
          <section className="modern-card p-6">
            <div className="flex items-start gap-4">
              <div className="icon-container flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">{t('about.howWeWork.title')}</h2>
                <ul className="text-muted-foreground space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{t('about.howWeWork.item1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{t('about.howWeWork.item2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{t('about.howWeWork.item3')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="modern-card p-6">
            <div className="flex items-start gap-4">
              <div className="icon-container flex-shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-4">{t('about.faq.title')}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`} className="border-border">
                      <AccordionTrigger className="text-left text-foreground hover:text-primary py-3 text-sm font-medium">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm pb-4">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="bg-status-stale-bg/60 border border-status-stale/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-status-stale/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-status-stale" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">{t('about.disclaimer.title')}</h2>
                <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
                  <p>{t('about.disclaimer.p1')}</p>
                  <p className="font-medium text-foreground">{t('about.disclaimer.p2')}</p>
                  <p>{t('about.disclaimer.p3')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Official Resources */}
          <section className="modern-card p-6">
            <div className="flex items-start gap-4">
              <div className="icon-container flex-shrink-0">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">{t('about.resources.title')}</h2>
                <ul className="space-y-3">
                  <li>
                    <a 
                      href="https://www.epassport.gov.bd" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1.5 text-sm font-medium"
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
                      className="text-primary hover:underline inline-flex items-center gap-1.5 text-sm font-medium"
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
                      className="text-primary hover:underline inline-flex items-center gap-1.5 text-sm font-medium"
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
          <section className="modern-card p-6">
            <div className="flex items-start gap-4">
              <div className="icon-container flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">{t('about.contact.title')}</h2>
                <p className="text-muted-foreground mb-4 text-sm">
                  {t('about.contact.desc')}
                </p>
                <a 
                  href="mailto:hello@infobase.gov.bd"
                  className="text-primary hover:underline inline-flex items-center gap-1.5 text-sm font-medium"
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