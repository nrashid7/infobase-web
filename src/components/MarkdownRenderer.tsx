import React from 'react';
import { Link } from 'react-router-dom';

function parseLinks(text: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const url = match[2];
    if (url.startsWith('/')) {
      parts.push(
        <Link key={`link-${match.index}`} to={url} className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a key={`link-${match.index}`} href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">
          {label}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
  );
}

function parseInline(text: string): React.ReactNode[] {
  const linkParsed = parseLinks(text);
  const result: React.ReactNode[] = [];
  
  linkParsed.forEach((part, idx) => {
    if (typeof part === 'string') {
      result.push(...parseBold(part).map((p, pi) => 
        typeof p === 'string' ? p : React.cloneElement(p as React.ReactElement, { key: `${idx}-${pi}` })
      ));
    } else {
      result.push(part);
    }
  });
  
  return result;
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = content.split(/\n\n+/);

  const rendered = blocks.map((block, bi) => {
    const lines = block.split('\n');

    // Check if block is a numbered list
    const isNumberedList = lines.every(
      (l) => /^\d+[.)]\s/.test(l.trim()) || l.trim() === ''
    );

    if (isNumberedList) {
      const items = lines.filter((l) => /^\d+[.)]\s/.test(l.trim()));
      return (
        <ol key={bi} className="list-decimal list-inside space-y-1.5 text-sm text-foreground/90">
          {items.map((item, ii) => (
            <li key={ii}>{parseInline(item.replace(/^\d+[.)]\s/, ''))}</li>
          ))}
        </ol>
      );
    }

    // Check if block is a bullet list
    const isBulletList = lines.every(
      (l) => /^[-•]\s/.test(l.trim()) || l.trim() === ''
    );

    if (isBulletList) {
      const items = lines.filter((l) => /^[-•]\s/.test(l.trim()));
      return (
        <ul key={bi} className="list-disc list-inside space-y-1.5 text-sm text-foreground/90">
          {items.map((item, ii) => (
            <li key={ii}>{parseInline(item.replace(/^[-•]\s/, ''))}</li>
          ))}
        </ul>
      );
    }

    // Regular paragraph
    return (
      <p key={bi} className="text-sm leading-relaxed text-foreground/90">
        {lines.map((line, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {parseInline(line)}
          </React.Fragment>
        ))}
      </p>
    );
  });

  return <div className="space-y-3">{rendered}</div>;
}
