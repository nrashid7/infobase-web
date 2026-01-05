import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// UI translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.sources': 'Official Sources',
    'nav.about': 'About',
    
    // Home page
    'home.title': 'Bangladesh Government Services',
    'home.subtitle': 'Find step-by-step guides for government services',
    'home.search.placeholder': 'What do you want to do? (passport, NID, driving license...)',
    'home.popular': 'Popular Services',
    'home.agencies': 'Government Agencies',
    'home.viewAll': 'View All Services',
    
    // Stats
    'stats.services': 'Service Guides',
    'stats.agencies': 'Agencies',
    'stats.citations': 'Verified Sources',
    'stats.domains': 'Official Domains',
    
    // Guide page
    'guide.backToGuides': 'All Guides',
    'guide.applyOnPortal': 'Apply on Official Portal',
    'guide.disclaimer': 'This is an unofficial guide. Always verify information on the official portal before taking action.',
    'guide.applicationType': 'Application Type',
    'guide.variant.regular': 'Regular',
    'guide.variant.regular.desc': 'Standard processing',
    'guide.variant.express': 'Express',
    'guide.variant.express.desc': 'Faster delivery',
    'guide.variant.super_express': 'Super Express',
    'guide.variant.super_express.desc': 'Fastest option',
    
    // Sections
    'section.availableServices': 'Available Services',
    'section.whoCanApply': 'Who Can Apply',
    'section.howToApply': 'How to Apply',
    'section.fees': 'Fees',
    'section.requiredDocuments': 'Required Documents',
    'section.processingTime': 'Processing Time',
    'section.quickLinks': 'Quick Links',
    'section.officialLinks': 'Official Links',
    'section.additionalInfo': 'Additional Information',
    
    // Table headers
    'table.type': 'Type',
    'table.pages': 'Pages',
    'table.delivery': 'Delivery',
    'table.amount': 'Amount',
    'table.workingDays': 'working days',
    
    // Actions
    'action.showSources': 'Show sources',
    'action.viewDetails': 'View details',
    'action.officialPortal': 'Official Portal',
    
    // Empty states
    'empty.guideNotFound': 'Guide not found',
    'empty.guideNotFoundDesc': 'The requested guide could not be found.',
    'empty.noResults': 'No results found',
    'empty.comingSoon': 'Full guide coming soon',
    'empty.comingSoonDesc': 'We\'re working on adding detailed steps, documents, and fees for this service.',
    
    // Search
    'search.placeholder': 'Search services...',
    'search.noResults': 'No services found',
    
    // Sources page
    'sources.title': 'Official Sources',
    'sources.subtitle': 'All information is sourced from official government websites',
    
    // About page
    'about.title': 'About',
  },
  bn: {
    // Navigation
    'nav.home': 'হোম',
    'nav.services': 'সেবাসমূহ',
    'nav.sources': 'অফিসিয়াল সোর্স',
    'nav.about': 'সম্পর্কে',
    
    // Home page
    'home.title': 'বাংলাদেশ সরকারি সেবা',
    'home.subtitle': 'সরকারি সেবার জন্য ধাপে ধাপে গাইড খুঁজুন',
    'home.search.placeholder': 'আপনি কী করতে চান? (পাসপোর্ট, এনআইডি, ড্রাইভিং লাইসেন্স...)',
    'home.popular': 'জনপ্রিয় সেবা',
    'home.agencies': 'সরকারি সংস্থা',
    'home.viewAll': 'সব সেবা দেখুন',
    
    // Stats
    'stats.services': 'সেবা গাইড',
    'stats.agencies': 'সংস্থা',
    'stats.citations': 'যাচাইকৃত সোর্স',
    'stats.domains': 'অফিসিয়াল ডোমেইন',
    
    // Guide page
    'guide.backToGuides': 'সব গাইড',
    'guide.applyOnPortal': 'অফিসিয়াল পোর্টালে আবেদন করুন',
    'guide.disclaimer': 'এটি একটি অনানুষ্ঠানিক গাইড। পদক্ষেপ নেওয়ার আগে সর্বদা অফিসিয়াল পোর্টালে তথ্য যাচাই করুন।',
    'guide.applicationType': 'আবেদনের ধরন',
    'guide.variant.regular': 'সাধারণ',
    'guide.variant.regular.desc': 'স্ট্যান্ডার্ড প্রসেসিং',
    'guide.variant.express': 'এক্সপ্রেস',
    'guide.variant.express.desc': 'দ্রুত ডেলিভারি',
    'guide.variant.super_express': 'সুপার এক্সপ্রেস',
    'guide.variant.super_express.desc': 'সবচেয়ে দ্রুত',
    
    // Sections
    'section.availableServices': 'উপলব্ধ সেবা',
    'section.whoCanApply': 'কে আবেদন করতে পারবে',
    'section.howToApply': 'কীভাবে আবেদন করবেন',
    'section.fees': 'ফি',
    'section.requiredDocuments': 'প্রয়োজনীয় কাগজপত্র',
    'section.processingTime': 'প্রসেসিং সময়',
    'section.quickLinks': 'দ্রুত লিংক',
    'section.officialLinks': 'অফিসিয়াল লিংক',
    'section.additionalInfo': 'অতিরিক্ত তথ্য',
    
    // Table headers
    'table.type': 'ধরন',
    'table.pages': 'পৃষ্ঠা',
    'table.delivery': 'ডেলিভারি',
    'table.amount': 'পরিমাণ',
    'table.workingDays': 'কার্যদিবস',
    
    // Actions
    'action.showSources': 'সোর্স দেখুন',
    'action.viewDetails': 'বিস্তারিত দেখুন',
    'action.officialPortal': 'অফিসিয়াল পোর্টাল',
    
    // Empty states
    'empty.guideNotFound': 'গাইড পাওয়া যায়নি',
    'empty.guideNotFoundDesc': 'অনুরোধকৃত গাইড খুঁজে পাওয়া যায়নি।',
    'empty.noResults': 'কোন ফলাফল পাওয়া যায়নি',
    'empty.comingSoon': 'সম্পূর্ণ গাইড শীঘ্রই আসছে',
    'empty.comingSoonDesc': 'আমরা এই সেবার জন্য বিস্তারিত ধাপ, কাগজপত্র এবং ফি যোগ করার কাজ করছি।',
    
    // Search
    'search.placeholder': 'সেবা খুঁজুন...',
    'search.noResults': 'কোন সেবা পাওয়া যায়নি',
    
    // Sources page
    'sources.title': 'অফিসিয়াল সোর্স',
    'sources.subtitle': 'সমস্ত তথ্য সরকারি অফিসিয়াল ওয়েবসাইট থেকে সংগৃহীত',
    
    // About page
    'about.title': 'সম্পর্কে',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
