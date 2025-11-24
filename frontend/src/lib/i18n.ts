import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import nlTranslations from './locales/nl.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      nl: {
        translation: nlTranslations,
      },
    },
    lng: localStorage.getItem('flowforce-language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Listen for language changes and update localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('flowforce-language', lng);
  document.documentElement.setAttribute('lang', lng);
});

export default i18n;
