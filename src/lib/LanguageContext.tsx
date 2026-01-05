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
    'nav.directory': 'Directory',
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
    'directory.title': 'Directory',
    'directory.subtitle': 'All official government websites of Bangladesh',

    // About page
    'about.title': 'About INFOBASE',
    'about.subtitle': 'Your trusted guide to Bangladesh government services.',
    'about.whatIs.title': 'What is INFOBASE?',
    'about.whatIs.desc': 'INFOBASE is a citizen-friendly guide to Bangladesh government services. We compile information from official government sources and present it in clear, step-by-step guides that are easy to follow.',
    'about.howWeWork.title': 'How we work',
    'about.howWeWork.item1': 'All information is sourced from official government websites and portals',
    'about.howWeWork.item2': 'Each fact includes a link to its official source so you can verify',
    'about.howWeWork.item3': 'We regularly update guides to reflect the latest changes',
    'about.disclaimer.title': 'Important Disclaimer',
    'about.disclaimer.p1': 'This website is an unofficial guide and is not affiliated with, endorsed by, or connected to any Bangladesh government agency.',
    'about.disclaimer.p2': 'While we strive to keep information accurate and up-to-date, government policies and procedures may change without notice. Always verify information on official government websites before taking action.',
    'about.disclaimer.p3': 'We are not responsible for any errors, omissions, or outcomes resulting from the use of information provided on this site.',
    'about.resources.title': 'Official Resources',
    'about.contact.title': 'Contact Us',
    'about.contact.desc': 'Have feedback or found an error? We would love to hear from you.',
  },
  bn: {
    // Navigation
    'nav.home': 'হোম',
    'nav.services': 'সেবাসমূহ',
    'nav.directory': 'ডিরেক্টরি',
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
    'directory.title': 'ডিরেক্টরি',
    'directory.subtitle': 'বাংলাদেশের সকল সরকারি অফিসিয়াল ওয়েবসাইট',

    // About page
    'about.title': 'INFOBASE সম্পর্কে',
    'about.subtitle': 'বাংলাদেশ সরকারি সেবার জন্য আপনার বিশ্বস্ত গাইড।',
    'about.whatIs.title': 'INFOBASE কী?',
    'about.whatIs.desc': 'INFOBASE হলো বাংলাদেশ সরকারি সেবার জন্য একটি নাগরিক-বান্ধব গাইড। আমরা অফিসিয়াল সরকারি সোর্স থেকে তথ্য সংগ্রহ করি এবং সেগুলো স্পষ্ট, ধাপে ধাপে গাইড আকারে উপস্থাপন করি যা সহজে অনুসরণ করা যায়।',
    'about.howWeWork.title': 'আমরা কীভাবে কাজ করি',
    'about.howWeWork.item1': 'সকল তথ্য অফিসিয়াল সরকারি ওয়েবসাইট এবং পোর্টাল থেকে সংগৃহীত',
    'about.howWeWork.item2': 'প্রতিটি তথ্যে অফিসিয়াল সোর্সের লিংক রয়েছে যাতে আপনি যাচাই করতে পারেন',
    'about.howWeWork.item3': 'আমরা নিয়মিত গাইড আপডেট করি সর্বশেষ পরিবর্তন অনুযায়ী',
    'about.disclaimer.title': 'গুরুত্বপূর্ণ দাবিত্যাগ',
    'about.disclaimer.p1': 'এই ওয়েবসাইটটি একটি অনানুষ্ঠানিক গাইড এবং বাংলাদেশের কোনো সরকারি সংস্থার সাথে সম্পৃক্ত, অনুমোদিত বা সংযুক্ত নয়।',
    'about.disclaimer.p2': 'যদিও আমরা তথ্য সঠিক এবং আপ-টু-ডেট রাখার চেষ্টা করি, সরকারি নীতি এবং প্রক্রিয়া বিনা নোটিশে পরিবর্তন হতে পারে। পদক্ষেপ নেওয়ার আগে সর্বদা অফিসিয়াল সরকারি ওয়েবসাইটে তথ্য যাচাই করুন।',
    'about.disclaimer.p3': 'এই সাইটে প্রদত্ত তথ্য ব্যবহারের ফলে কোনো ত্রুটি, বাদ পড়া বা ফলাফলের জন্য আমরা দায়ী নই।',
    'about.resources.title': 'অফিসিয়াল রিসোর্স',
    'about.contact.title': 'যোগাযোগ করুন',
    'about.contact.desc': 'প্রতিক্রিয়া আছে বা কোনো ত্রুটি পেয়েছেন? আমরা আপনার কাছ থেকে শুনতে চাই।',
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
