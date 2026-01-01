import { FileText, AlertTriangle, ExternalLink, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="py-8 px-4">
      <div className="container max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">About INFOBASE</h1>
          <p className="text-muted-foreground">
            Your trusted guide to Bangladesh government services.
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
                <h2 className="text-lg font-semibold text-foreground mb-2">What is INFOBASE?</h2>
                <p className="text-muted-foreground">
                  INFOBASE is a citizen-friendly guide to Bangladesh government services. We compile 
                  information from official government sources and present it in clear, step-by-step 
                  guides that are easy to follow.
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
                <h2 className="text-lg font-semibold text-foreground mb-2">How we work</h2>
                <ul className="text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    All information is sourced from official government websites and portals
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Each fact includes a link to its official source so you can verify
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We regularly update guides to reflect the latest changes
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
                <h2 className="text-lg font-semibold text-foreground mb-2">Important Disclaimer</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    This website is an <strong>unofficial guide</strong> and is not affiliated with, 
                    endorsed by, or connected to any Bangladesh government agency.
                  </p>
                  <p>
                    While we strive to keep information accurate and up-to-date, government policies 
                    and procedures may change without notice. <strong>Always verify information on 
                    official government websites before taking action.</strong>
                  </p>
                  <p>
                    We are not responsible for any errors, omissions, or outcomes resulting from the 
                    use of information provided on this site.
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
                <h2 className="text-lg font-semibold text-foreground mb-3">Official Resources</h2>
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
        </div>
      </div>
    </div>
  );
}
