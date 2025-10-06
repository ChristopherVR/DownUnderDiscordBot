// Export main configuration
export { initI18n, NAMESPACES, type I18nConfig, type Namespace } from './config';
export { default as i18n } from './config';

// Export utility functions
export {
  t,
  tCommon,
  tErrors,
  tCommands,
  tUI,
  isI18nReady,
  getCurrentLanguage,
  changeLanguage,
  getAvailableLanguages,
  formatError,
  getCommandInfo,
  hasTranslation,
} from './utils.js';

// Export types for type safety
export type {
  CommonTranslations,
  ErrorTranslations,
  UITranslations,
  CommandTranslations,
  TranslationKey,
  TranslationOptions,
  TranslationFunction,
} from './types.js';
