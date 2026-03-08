import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
          <span className="text-4xl font-bold text-primary">404</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          {language === 'bn' ? 'পৃষ্ঠা পাওয়া যায়নি' : 'Page not found'}
        </h1>
        <p className="mb-6 text-lg text-muted-foreground">
          {language === 'bn' 
            ? 'আপনি যে পৃষ্ঠাটি খুঁজছেন তা বিদ্যমান নেই।' 
            : "The page you're looking for doesn't exist."}
        </p>
        <Button asChild>
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            {language === 'bn' ? 'হোমে ফিরে যান' : 'Return to Home'}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
