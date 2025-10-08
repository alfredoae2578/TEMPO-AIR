import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#87CEEB]/10 rounded-full transition-colors flex items-center gap-2"
        aria-label="Select language"
      >
        <Globe className="w-5 h-5 text-white" />
        <span className="hidden sm:inline text-white text-sm font-medium">
          {currentLanguage.flag}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay to close dropdown when clicking outside */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-12 right-0 w-48 bg-gradient-to-br from-[#2d5a7b]/95 to-[#4A90A4]/95 backdrop-blur-md rounded-xl shadow-2xl border border-[#87CEEB]/30 overflow-hidden z-40"
            >
              <div className="p-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      i18n.language === lang.code
                        ? 'bg-[#87CEEB]/30 text-white'
                        : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                    {i18n.language === lang.code && (
                      <span className="ml-auto text-[#98D8C8]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
