import { createContext, useContext } from 'react';
import { de } from './de';
import { en, type Catalog } from './en';
import { es } from './es';
import { fr } from './fr';
import { ptBR } from './pt-BR';

export type { Catalog };

export const LOCALES = ['en', 'pt-BR', 'es', 'fr', 'de'] as const;
export type Locale = (typeof LOCALES)[number];

/** Endonyms, so the selector reads the same in every language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

export const CATALOGS: Record<Locale, Catalog> = { en, 'pt-BR': ptBR, es, fr, de };

const STORE_KEY = 'noosphere:locale';

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

/** The first browser language that is one of the five; any Portuguese counts as pt-BR. */
export const browserLocale = (languages: readonly string[]): Locale => {
  for (const tag of languages) {
    const base = (tag ?? '').toLowerCase().split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (isLocale(base)) return base;
  }
  return 'en';
};

/** `?lang=` wins (and is remembered), then the saved choice, then the browser, then English. */
export const bootLocale = (): Locale => {
  try {
    const forced = new URLSearchParams(window.location.search).get('lang');
    if (isLocale(forced)) {
      saveLocale(forced);
      return forced;
    }
  } catch {
    // no location (tests)
  }
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // storage unavailable
  }
  const languages =
    typeof navigator === 'undefined'
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  return browserLocale(languages);
};

export const saveLocale = (locale: Locale) => {
  try {
    localStorage.setItem(STORE_KEY, locale);
  } catch {
    // private mode keeps the choice for this session
  }
};

export interface I18n {
  locale: Locale;
  t: Catalog;
  setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18n>({ locale: 'en', t: en, setLocale: () => {} });

export const useI18n = () => useContext(I18nContext);

// Game data keeps only ids; these look the words up. A missing id falls back to English, then the id.
const pick = <T>(
  table: Record<string, T>,
  fallback: Record<string, T>,
  id: string,
): T | undefined => table[id] ?? fallback[id];

export const chapterText = (t: Catalog, id: string) =>
  pick<{ title: string; intro: string }>(t.chapters, en.chapters, id) ?? { title: id, intro: '' };
export const objectiveText = (t: Catalog, id: string) =>
  pick<{ label: string; hint: string; hintTouch?: string }>(t.objectives, en.objectives, id) ?? {
    label: id,
    hint: '',
  };
export const insightText = (t: Catalog, id: string) =>
  pick<{ title: string; description: string }>(t.insights, en.insights, id) ?? {
    title: id,
    description: '',
  };
