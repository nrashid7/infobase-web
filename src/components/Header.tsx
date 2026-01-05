import { useState } from 'react';
import { Home, BookOpen, Globe, Info, Menu, X } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { title: t('nav.home'), url: '/', icon: Home },
    { title: t('nav.services'), url: '/guides', icon: BookOpen },
    { title: t('nav.directory'), url: '/directory', icon: Globe },
    { title: t('nav.about'), url: '/about', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border/80">
      <div className="flex items-center gap-4 px-4 md:px-6 h-14 max-w-7xl mx-auto">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-medium tracking-wide text-foreground leading-none">INFOBASE</h1>
            <p className="text-[10px] text-muted-foreground">BD Gov Guides</p>
          </div>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-8">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === '/'}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              activeClassName="text-foreground bg-accent font-medium"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Language Toggle */}
        <LanguageToggle />

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-sm font-medium tracking-wide text-foreground leading-none">INFOBASE</h1>
                    <p className="text-[10px] text-muted-foreground">BD Gov Guides</p>
                  </div>
                </div>
              </div>
              <nav className="flex flex-col p-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    end={item.url === '/'}
                    className="flex items-center gap-3 px-3 py-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    activeClassName="text-foreground bg-accent font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}