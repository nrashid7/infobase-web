import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { listGuides, type GuideIndexEntry } from '@/lib/guidesStore';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearch({ className, placeholder = "What do you want to do?" }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GuideIndexEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      const searchResults = listGuides({ search: value });
      setResults(searchResults.slice(0, 6)); // Limit to 6 results
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, []);

  const handleSelect = (guide: GuideIndexEntry) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    navigate(`/guides/${guide.guide_id}`);
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
          {results.map((guide) => (
            <button
              key={guide.guide_id}
              onClick={() => handleSelect(guide)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-accent text-left border-b border-border last:border-0 transition-colors"
            >
              <div className="mt-0.5">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground block">{guide.title}</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{guide.agency_name}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {guide.step_count > 0 ? `${guide.step_count} steps` : 'Info'}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground">
          No guides found for "{query}"
        </div>
      )}
    </div>
  );
}
