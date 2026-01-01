import { ExternalLink } from 'lucide-react';
import { NormalizedSourcePage } from '@/lib/kbStore';
import { cn } from '@/lib/utils';

interface SourceLinkProps {
  source: NormalizedSourcePage | undefined;
  className?: string;
  label?: string;
}

export function SourceLink({ source, className, label = 'Source' }: SourceLinkProps) {
  if (!source?.canonical_url) {
    return null;
  }

  return (
    <a
      href={source.canonical_url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors",
        className
      )}
    >
      <ExternalLink className="w-3 h-3" />
      <span>{label}</span>
    </a>
  );
}
