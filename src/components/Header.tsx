import { SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageToggle } from './LanguageToggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border/80">
      <div className="flex items-center gap-4 px-4 h-14">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="flex-1" />
        <LanguageToggle />
      </div>
    </header>
  );
}