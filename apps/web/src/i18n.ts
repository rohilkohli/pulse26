import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Inline resources for performance (no HTTP backend needed for small sets)
const resources = {
  en: {
    translation: {
      nav: { home: 'Home', navigate: 'Navigate', chat: 'Concierge', match: 'My Match' },
      common: { live: 'Live', loading: 'Loading...', error: 'Error', tryAgain: 'Try again' },
    },
  },
  es: {
    translation: {
      nav: { home: 'Inicio', navigate: 'Navegar', chat: 'Asistente', match: 'Mi Partido' },
      common: { live: 'En Vivo', loading: 'Cargando...', error: 'Error', tryAgain: 'Intentar de nuevo' },
    },
  },
  fr: {
    translation: {
      nav: { home: 'Accueil', navigate: 'Naviguer', chat: 'Aide', match: 'Mon Match' },
      common: { live: 'En Direct', loading: 'Chargement...', error: 'Erreur', tryAgain: 'Réessayer' },
    },
  },
  pt: {
    translation: {
      nav: { home: 'Início', navigate: 'Navegar', chat: 'Assistente', match: 'Meu Jogo' },
      common: { live: 'Ao Vivo', loading: 'Carregando...', error: 'Erro', tryAgain: 'Tentar novamente' },
    },
  },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
