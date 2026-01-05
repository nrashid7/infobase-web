import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { listGuides } from '@/lib/guidesStore';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask`;

export function AskAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setAnswer('');

    // Build context from available guides
    const guides = listGuides();
    const context = guides.map(g => `- ${g.title} (${g.agency_name})`).join('\n');

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ question: question.trim(), context }),
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
        setIsLoading(false);
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
              setAnswer(fullAnswer);
            }
          } catch {
            // Incomplete JSON, put back and wait
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('Ask error:', e);
      toast({ title: 'Error', description: 'Failed to get answer. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuestion('');
    setAnswer('');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2 text-primary hover:text-primary"
      >
        <Sparkles className="w-4 h-4" />
        Ask AI
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Ask about government services</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Input */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. How do I apply for an e-Passport?"
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={handleAsk} disabled={!question.trim() || isLoading} size="icon">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Answer */}
        <div className={cn(
          "p-4 max-h-[60vh] overflow-y-auto",
          !answer && "text-center text-muted-foreground py-8"
        )}>
          {answer ? (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {answer}
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2 justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Thinking...</span>
            </div>
          ) : (
            <p>Ask any question about Bangladesh government services</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground text-center">
          AI responses may not be accurate. Always verify on official portals.
        </div>
      </div>
    </div>
  );
}
