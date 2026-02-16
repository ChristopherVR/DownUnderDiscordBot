import i18next from 'i18next';
import { NAMESPACES, type Namespace } from './config';

/**
 * Type-safe translation function with namespace support
 */
export const t = (key: string, options?: Record<string, unknown>, namespace?: Namespace) => {
  if (namespace) {
    return i18next.t(key, { ...options, ns: namespace });
  }
  return i18next.t(key, options);
};

/**
 * Translation functions for specific namespaces
 */
export const tCommon = (key: string, options?: Record<string, unknown>) => t(key, options, NAMESPACES.COMMON);

export const tErrors = (key: string, options?: Record<string, unknown>) => t(key, options, NAMESPACES.ERRORS);

export const tCommands = (key: string, options?: Record<string, unknown>) => t(key, options, NAMESPACES.COMMANDS);

export const tUI = (key: string, options?: Record<string, unknown>) => t(key, options, NAMESPACES.UI);

/**
 * Check if i18next is initialized and ready
 */
export const isI18nReady = (): boolean => {
  return i18next.isInitialized;
};

/**
 * Get current language
 */
export const getCurrentLanguage = (): string => {
  return i18next.language || 'en';
};

/**
 * Change language dynamically
 */
export const changeLanguage = async (lng: string): Promise<void> => {
  await i18next.changeLanguage(lng);
};

/**
 * Get available languages
 */
export const getAvailableLanguages = (): string[] => {
  return ['en']; // Currently only English, can be extended
};

/**
 * Format error message with context
 */
export const formatError = (errorKey: string, context?: Record<string, string | number>): string => {
  const message = tErrors(errorKey, context) as string;

  // Fallback to generic error if specific error not found
  if (message === errorKey) {
    return tErrors('generic') as string;
  }

  return message;
};

/**
 * Get localized command information
 */
export const getCommandInfo = (commandName: string) => {
  return {
    name: tCommands(`${commandName}.name`),
    description: tCommands(`${commandName}.description`),
  };
};

/**
 * Validate translation key exists
 */
export const hasTranslation = (key: string, namespace?: Namespace): boolean => {
  const fullKey = namespace ? `${namespace}:${key}` : key;
  return i18next.exists(fullKey);
};
