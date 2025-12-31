import { AlertTriangle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="container py-6">
        <div className="flex items-start gap-3 p-4 bg-status-stale-bg/50 rounded-lg border border-status-stale/20">
          <AlertTriangle className="w-5 h-5 text-status-stale flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Important Disclaimer</p>
            <p className="text-muted-foreground mt-1">
              This site does not replace official government portals. Always verify information on the official source before taking any action. 
              Data shown is sourced from government websites and may be subject to change.
            </p>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          INFOBASE — Bangladesh Government Services Knowledge Base v2
        </div>
      </div>
    </footer>
  );
}
