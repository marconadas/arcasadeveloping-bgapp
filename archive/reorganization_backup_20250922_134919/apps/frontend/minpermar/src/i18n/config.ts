import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Importar traduções
import ptTranslations from './locales/pt.json'
import enTranslations from './locales/en.json'
import frTranslations from './locales/fr.json'

const resources = {
  pt: {
    translation: ptTranslations
  },
  en: {
    translation: enTranslations
  },
  fr: {
    translation: frTranslations
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    lng: 'pt',
    
    interpolation: {
      escapeValue: false // React já faz escape por padrão
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

export default i18n
