import { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { NormalizedClaim } from '@/lib/kbStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DataTransparencyModalProps {
  claim: NormalizedClaim;
}

export function DataTransparencyModal({ claim }: DataTransparencyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(claim, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline">
          Data transparency
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Data Transparency
          </DialogTitle>
          <DialogDescription>
            Technical details for this information record.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Claim ID</p>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {claim.id}
            </code>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Full JSON Data</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyJson}
                className="h-7 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy JSON
                  </>
                )}
              </Button>
            </div>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap max-h-64">
              {JSON.stringify(claim, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
