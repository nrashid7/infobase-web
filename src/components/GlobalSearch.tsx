import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Building2, Sparkles, Send, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listGuides, type GuideIndexEntry } from '@/lib/guidesStore';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask`;

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearch({ className, placeholder }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GuideIndexEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiQuestion, setAIQuestion] = useState('');
  const [aiAnswer, setAIAnswer] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const aiInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAIOpen && aiInputRef.current) {
      aiInputRef.current.focus();
    }
  }, [isAIOpen]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      const searchResults = listGuides({ search: value });
      setResults(searchResults.slice(0, 6));
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

  const handleAsk = async () => {
    if (!aiQuestion.trim() || isAILoading) return;

    setIsAILoading(true);
    setAIAnswer('');

    const guides = listGuides();
    const context = guides.map(g => `- ${g.title} (${g.agency_name})`).join('\n');

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ question: aiQuestion.trim(), context }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast({ title: 'Too many requests', description: 'Please wait a moment and try again.', variant: 'destructive' });
        } else if (resp.status === 402) {
          toast({ title: 'Service unavailable', description: 'Please try again later.', variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: errorData.error || 'Failed to get answer', variant: 'destructive' });
        }
        setIsAILoading(false);
        return;
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullAnswer += content;
              setAIAnswer(fullAnswer);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('Ask error:', e);
      toast({ title: 'Error', description: 'Failed to get answer. Please try again.', variant: 'destructive' });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleAIKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleCloseAI = () => {
    setIsAIOpen(false);
    setAIQuestion('');
    setAIAnswer('');
  };

  const defaultPlaceholder = language === 'bn' ? 'আপনি কী করতে চান?' : 'What do you want to do?';

  return (
    <>
      <div className={cn("relative", className)}>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => query.length >= 2 && setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              placeholder={placeholder || defaultPlaceholder}
              className="pl-10 bg-secondary/50 border-border focus:bg-card"
            />
          </div>
          <Button
            onClick={() => setIsAIOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2 text-primary hover:text-primary shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </Button>
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
                  {guide.step_count > 0 
                    ? `${guide.step_count} ${language === 'bn' ? 'ধাপ' : 'steps'}` 
                    : language === 'bn' ? 'তথ্য' : 'Info'}
                </span>
              </button>
            ))}
          </div>
        )}

        {isOpen && query.length >= 2 && results.length === 0 && (
          <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground">
            {language === 'bn' 
              ? `"${query}" এর জন্য কোন গাইড পাওয়া যায়নি`
              : `No guides found for "${query}"`}
          </div>
        )}
      </div>

      {/* AI Modal */}
      {isAIOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Ask about government services</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseAI} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 border-b border-border">
              <div className="flex gap-2">
                <Input
                  ref={aiInputRef}
                  value={aiQuestion}
                  onChange={(e) => setAIQuestion(e.target.value)}
                  onKeyDown={handleAIKeyDown}
                  placeholder="e.g. How do I apply for an e-Passport?"
                  className="flex-1"
                  disabled={isAILoading}
                />
                <Button onClick={handleAsk} disabled={!aiQuestion.trim() || isAILoading} size="icon">
                  {isAILoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className={cn(
              "p-4 max-h-[60vh] overflow-y-auto",
              !aiAnswer && "text-center text-muted-foreground py-8"
            )}>
              {aiAnswer ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {aiAnswer}
                </div>
              ) : isAILoading ? (
                <div className="flex items-center gap-2 justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Thinking...</span>
                </div>
              ) : (
                <p>Ask any question about Bangladesh government services</p>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground text-center">
              AI responses may not be accurate. Always verify on official portals.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
