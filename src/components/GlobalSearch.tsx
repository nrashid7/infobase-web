import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Database, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { globalSearch, SearchResult } from '@/lib/kbStore';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearch({ className, placeholder = "Search services, claims, sources..." }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      const searchResults = globalSearch(value);
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, []);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);

    switch (result.type) {
      case 'service':
        navigate(`/services/${result.id}`);
        break;
      case 'claim':
        navigate(`/claims/${result.id}`);
        break;
      case 'source':
        navigate(`/sources/${result.id}`);
        break;
    }
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'service':
        return <Database className="w-4 h-4 text-muted-foreground" />;
      case 'claim':
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      case 'source':
        return <Link2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="pl-10 bg-secondary/50 border-border focus:bg-card"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-accent text-left border-b border-border last:border-0 transition-colors"
            >
              <div className="mt-0.5">{getIcon(result.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{result.title}</span>
                  {result.status && <StatusBadge status={result.status} size="sm" />}
                </div>
                <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
              </div>
              <span className="text-xs text-muted-foreground uppercase">{result.type}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
