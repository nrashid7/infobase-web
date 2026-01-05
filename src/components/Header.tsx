import { SidebarTrigger } from '@/components/ui/sidebar';
import { GlobalSearch } from './GlobalSearch';
import { LanguageToggle } from './LanguageToggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-4 px-4 h-14">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <GlobalSearch className="flex-1 max-w-xl" />
        <LanguageToggle />
      </div>
    </header>
  );
}
