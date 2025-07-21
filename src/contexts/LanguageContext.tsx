import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'header.search': 'Search items in your community...',
    'header.shareItem': 'Share Item',
    'header.signIn': 'Sign In',
    'header.myProfile': 'My Profile',
    'header.myItems': 'My Items',
    'header.signOut': 'Sign Out',
    
    // Hero Section
    'hero.title': 'Share & Discover in Your Community',
    'hero.subtitle': 'Connect with neighbors to share, lend, and discover items in your local area. Building stronger communities through sharing.',
    'hero.getStarted': 'Get Started',
    'hero.learnMore': 'Learn More',
    
    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    
    // Items
    'item.available': 'Available',
    'item.unavailable': 'Unavailable',
    'item.messageOwner': 'Message Owner',
    'item.category': 'Category',
    'item.condition': 'Condition',
    'item.location': 'Location',
    
    // List Item
    'listItem.title': 'Share an Item',
    'listItem.itemName': 'Item Name',
    'listItem.description': 'Description',
    'listItem.descriptionPlaceholder': 'Describe your item, its condition, and any details...',
    'listItem.selectCategory': 'Select Category',
    'listItem.selectCondition': 'Select Condition',
    'listItem.uploadImages': 'Upload Images',
    'listItem.shareItem': 'Share Item',
    
    // Categories
    'category.all': 'All Categories',
    'category.electronics': 'Electronics',
    'category.furniture': 'Furniture',
    'category.books': 'Books',
    'category.clothing': 'Clothing',
    'category.sports': 'Sports',
    'category.tools': 'Tools',
    'category.garden': 'Garden',
    'category.toys': 'Toys',
    'category.other': 'Other',
    
    // Conditions
    'condition.new': 'New',
    'condition.likeNew': 'Like New',
    'condition.good': 'Good',
    'condition.fair': 'Fair',
    'condition.poor': 'Poor',
    
    // Messages
    'messages.title': 'Messages',
    'messages.noConversations': 'No conversations yet',
    'messages.startConversation': 'Start a conversation by messaging someone about their item!',
    'messages.typeMessage': 'Type a message...',
    'messages.send': 'Send',
    'messages.selectConversation': 'Select a conversation to start messaging',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
  },
  de: {
    // Header
    'header.search': 'Artikel in deiner Community suchen...',
    'header.shareItem': 'Artikel teilen',
    'header.signIn': 'Anmelden',
    'header.myProfile': 'Mein Profil',
    'header.myItems': 'Meine Artikel',
    'header.signOut': 'Abmelden',
    
    // Hero Section
    'hero.title': 'Teilen & Entdecken in deiner Community',
    'hero.subtitle': 'Verbinde dich mit Nachbarn, um Artikel in deiner Umgebung zu teilen, zu leihen und zu entdecken. Stärkere Gemeinschaften durch Teilen.',
    'hero.getStarted': 'Loslegen',
    'hero.learnMore': 'Mehr erfahren',
    
    // Auth
    'auth.signIn': 'Anmelden',
    'auth.signUp': 'Registrieren',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.confirmPassword': 'Passwort bestätigen',
    'auth.forgotPassword': 'Passwort vergessen?',
    'auth.noAccount': 'Noch kein Konto?',
    'auth.hasAccount': 'Bereits ein Konto?',
    
    // Items
    'item.available': 'Verfügbar',
    'item.unavailable': 'Nicht verfügbar',
    'item.messageOwner': 'Besitzer kontaktieren',
    'item.category': 'Kategorie',
    'item.condition': 'Zustand',
    'item.location': 'Ort',
    
    // List Item
    'listItem.title': 'Artikel teilen',
    'listItem.itemName': 'Artikelname',
    'listItem.description': 'Beschreibung',
    'listItem.descriptionPlaceholder': 'Beschreibe deinen Artikel, seinen Zustand und weitere Details...',
    'listItem.selectCategory': 'Kategorie auswählen',
    'listItem.selectCondition': 'Zustand auswählen',
    'listItem.uploadImages': 'Bilder hochladen',
    'listItem.shareItem': 'Artikel teilen',
    
    // Categories
    'category.all': 'Alle Kategorien',
    'category.electronics': 'Elektronik',
    'category.furniture': 'Möbel',
    'category.books': 'Bücher',
    'category.clothing': 'Kleidung',
    'category.sports': 'Sport',
    'category.tools': 'Werkzeuge',
    'category.garden': 'Garten',
    'category.toys': 'Spielzeug',
    'category.other': 'Sonstiges',
    
    // Conditions
    'condition.new': 'Neu',
    'condition.likeNew': 'Wie neu',
    'condition.good': 'Gut',
    'condition.fair': 'Angemessen',
    'condition.poor': 'Schlecht',
    
    // Messages
    'messages.title': 'Nachrichten',
    'messages.noConversations': 'Noch keine Unterhaltungen',
    'messages.startConversation': 'Beginne eine Unterhaltung, indem du jemanden wegen seines Artikels anschreibst!',
    'messages.typeMessage': 'Nachricht eingeben...',
    'messages.send': 'Senden',
    'messages.selectConversation': 'Wähle eine Unterhaltung aus, um zu chatten',
    
    // Common
    'common.loading': 'Lädt...',
    'common.error': 'Fehler',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.previous': 'Zurück',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('bubble-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bubble-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};