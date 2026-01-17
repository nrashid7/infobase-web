import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listGuides } from '@/lib/guidesStore';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask`;

interface GlobalSearchProps {
  className?: string;
}

// Quick questions for common queries
const quickQuestions = [
  { en: 'How do I apply for a passport?', bn: 'পাসপোর্টের জন্য কিভাবে আবেদন করব?' },
  { en: 'NID correction process?', bn: 'এনআইডি সংশোধন প্রক্রিয়া কি?' },
  { en: 'How to get a birth certificate?', bn: 'জন্ম সনদ কিভাবে পাব?' },
  { en: 'Driving license renewal steps?', bn: 'ড্রাইভিং লাইসেন্স নবায়ন করব কিভাবে?' },
];

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-sm text-muted-foreground animate-pulse">AI is thinking...</span>
    </div>
  );
}

// Animated suggestion rotator for the search bar - optimized to prevent forced reflows
function AnimatedPlaceholder({ suggestions, language }: { suggestions: typeof quickQuestions; language: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const currentSuggestion = language === 'bn' ? suggestions[currentIndex].bn : suggestions[currentIndex].en;

  useEffect(() => {
    let cancelled = false;
    const typingSpeed = 50;
    const deletingSpeed = 30;
    const pauseDuration = 2000;

    const animate = (timestamp: number) => {
      if (cancelled) return;

      const elapsed = timestamp - lastTimeRef.current;
      
      if (isTyping) {
        if (displayText.length < currentSuggestion.length) {
          if (elapsed >= typingSpeed) {
            lastTimeRef.current = timestamp;
            setDisplayText(currentSuggestion.slice(0, displayText.length + 1));
          }
        } else {
          if (elapsed >= pauseDuration) {
            lastTimeRef.current = timestamp;
            setIsTyping(false);
          }
        }
      } else {
        if (displayText.length > 0) {
          if (elapsed >= deletingSpeed) {
            lastTimeRef.current = timestamp;
            setDisplayText(displayText.slice(0, -1));
          }
        } else {
          setCurrentIndex((prev) => (prev + 1) % suggestions.length);
          setIsTyping(true);
          lastTimeRef.current = timestamp;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [displayText, isTyping, currentSuggestion, suggestions.length]);

  return (
    <span className="text-muted-foreground">
      {displayText}
      <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary/60 animate-pulse" />
    </span>
  );
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiQuestion, setAIQuestion] = useState('');
  const [aiAnswer, setAIAnswer] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const aiInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAIOpen && aiInputRef.current) {
      aiInputRef.current.focus();
    }
  }, [isAIOpen]);

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
        body: JSON.stringify({ question: aiQuestion.trim(), context, language }),
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

  const handleQuickQuestion = (question: string) => {
    setAIQuestion(question);
    // Auto-submit the question
    setTimeout(() => {
      aiInputRef.current?.focus();
    }, 50);
  };

  const aiPlaceholder = t('home.search.placeholder');

  return (
    <>
      <div className={cn("relative", className)}>
        {/* Main AI Search Bar */}
        <button
          onClick={() => setIsAIOpen(true)}
          className="w-full flex items-center gap-3 px-5 py-4 bg-card border-2 border-border rounded-2xl shadow-soft hover:border-primary/40 hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
        >
          {/* Animated gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-primary group-hover:animate-pulse" />
          </div>
          
          <div className="flex-1 text-left text-base overflow-hidden">
            <AnimatedPlaceholder suggestions={quickQuestions} language={language} />
          </div>
          
          <span className="relative text-xs text-primary hidden sm:inline px-3 py-1.5 rounded-full bg-primary/10 font-medium border border-primary/20 group-hover:bg-primary/15 transition-colors">
            {language === 'bn' ? '✨ AI' : '✨ AI-powered'}
          </span>
        </button>
      </div>

      {/* AI Modal - rendered as overlay */}
      <AnimatePresence>
        {isAIOpen && (
          <motion.div 
            className="fixed inset-0 z-[100] flex items-start justify-center pt-16 md:pt-24 px-4 bg-background/80 backdrop-blur-sm" 
            onClick={handleCloseAI}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-foreground">
                    {language === 'bn' ? 'সরকারি সেবা সম্পর্কে জিজ্ঞাসা করুন' : 'Ask about government services'}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCloseAI} className="h-8 w-8 rounded-lg">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Input */}
              <div className="p-4 border-b border-border">
                <div className="flex gap-3">
                  <Input
                    ref={aiInputRef}
                    value={aiQuestion}
                    onChange={(e) => setAIQuestion(e.target.value)}
                    onKeyDown={handleAIKeyDown}
                    placeholder={aiPlaceholder}
                    className="flex-1 h-11"
                    disabled={isAILoading}
                  />
                  <Button onClick={handleAsk} disabled={!aiQuestion.trim() || isAILoading} size="icon" className="h-11 w-11">
                    {isAILoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Response */}
              <div className={cn(
                "p-5 max-h-[60vh] overflow-y-auto min-h-[120px]",
                !aiAnswer && !isAILoading && "flex flex-col items-center justify-center text-center"
              )}>
                {aiAnswer ? (
                  <motion.div 
                    className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {aiAnswer}
                  </motion.div>
                ) : isAILoading ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    </div>
                    <TypingIndicator />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === 'bn' 
                        ? 'বাংলাদেশ সরকারি সেবা সম্পর্কে যেকোনো প্রশ্ন জিজ্ঞাসা করুন'
                        : 'Ask any question about Bangladesh government services'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {quickQuestions.map((q, idx) => (
                        <motion.button
                          key={idx}
                          onClick={() => handleQuickQuestion(language === 'bn' ? q.bn : q.en)}
                          className="px-4 py-2 text-xs rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary hover:from-primary/20 hover:to-primary/15 transition-all duration-300 border border-primary/20 hover:border-primary/40 hover:shadow-md"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05, duration: 0.2 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {language === 'bn' ? q.bn : q.en}
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground text-center">
                {language === 'bn' 
                  ? 'AI উত্তর সঠিক নাও হতে পারে। সর্বদা অফিসিয়াল পোর্টালে যাচাই করুন।'
                  : 'AI responses may not be accurate. Always verify on official portals.'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}