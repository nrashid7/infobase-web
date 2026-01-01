import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, FileCode } from 'lucide-react';
import { NormalizedClaim, getSourcePageById } from '@/lib/kbStore';
import { Button } from '@/components/ui/button';

interface AuditDetailsAccordionProps {
  claim: NormalizedClaim;
}

export function AuditDetailsAccordion({ claim }: AuditDetailsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(claim, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get source page info for audit display
  const sourcePages = claim.citations.map(cit => getSourcePageById(cit.source_page_id)).filter(Boolean);

  return (
    <div className="border-t border-border/50 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        <FileCode className="w-3 h-3" />
        <span>Audit details</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 p-3 bg-muted/30 rounded-lg text-xs space-y-3">
          {/* Claim ID */}
          <div>
            <p className="font-medium text-muted-foreground mb-1">Claim ID</p>
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              {claim.id}
            </code>
          </div>

          {/* Source Page IDs */}
          {sourcePages.length > 0 && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">Source Page IDs</p>
              <div className="space-y-1">
                {claim.citations.map((cit, idx) => (
                  <code key={idx} className="block bg-muted px-2 py-0.5 rounded font-mono text-foreground">
                    {cit.source_page_id}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Content Hash */}
          {sourcePages.some(sp => sp?.content_hash) && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">Content Hash</p>
              {sourcePages.map((sp, idx) => sp?.content_hash && (
                <code key={idx} className="block bg-muted px-2 py-0.5 rounded font-mono text-foreground truncate">
                  {sp.content_hash}
                </code>
              ))}
            </div>
          )}

          {/* Snapshot Ref */}
          {sourcePages.some(sp => sp?.snapshot_ref) && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">Snapshot Reference</p>
              {sourcePages.map((sp, idx) => sp?.snapshot_ref && (
                <code key={idx} className="block bg-muted px-2 py-0.5 rounded font-mono text-foreground truncate">
                  {sp.snapshot_ref}
                </code>
              ))}
            </div>
          )}

          {/* Copy JSON */}
          <div className="pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              className="h-7 text-xs w-full"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1.5" />
                  Copy audit record (JSON)
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
