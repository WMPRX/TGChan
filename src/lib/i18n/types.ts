export type LanguageCode = 'tr' | 'en' | 'ru' | 'zh' | 'id' | 'vi' | 'es' | 'ar' | 'de' | 'fr';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export const LANGUAGE_FLAGS: Record<string, string> = {
  tr: '🇹🇷', en: '🇬🇧', ru: '🇷🇺', zh: '🇨🇳', id: '🇮🇩',
  vi: '🇻🇳', es: '🇪🇸', ar: '🇸🇦', de: '🇩🇪', fr: '🇫🇷',
};

export const LANGUAGE_CODES_MAP: Record<string, string> = {
  tr: 'TR', en: 'EN', ru: 'RU', zh: 'ZH', id: 'ID',
  vi: 'VI', es: 'ES', ar: 'AR', de: 'DE', fr: 'FR',
};
