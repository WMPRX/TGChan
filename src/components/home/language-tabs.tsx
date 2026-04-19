'use client';

import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { LANGUAGE_FLAGS, type LanguageCode } from '@/lib/i18n/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface LanguageStat {
  code: string;
  channelCount: number;
}

export function LanguageTabs({ languages }: { languages: LanguageStat[] }) {
  const { t, language } = useI18n();
  const { languageFilter, setLanguageFilter } = useAppStore();
  const [showMore, setShowMore] = useState(false);

  const mainLangs = languages.slice(0, 7);
  const moreLangs = languages.slice(7);
  const displayLangs = showMore ? languages : mainLangs;

  return (
    <div className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex items-center gap-1 py-2">
            {/* Global tab */}
            <button
              onClick={() => setLanguageFilter('global')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                languageFilter === 'global'
                  ? 'text-[#229ED9] bg-[#229ED9]/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <span>🌐</span>
              <span>{t('home.languageTabs.global')}</span>
              <span className="text-xs text-muted-foreground">
                ({languages.reduce((sum, l) => sum + l.channelCount, 0)})
              </span>
            </button>

            {displayLangs.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguageFilter(lang.code)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  languageFilter === lang.code
                    ? 'text-[#229ED9] bg-[#229ED9]/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <span>{LANGUAGE_FLAGS[lang.code] || '🌐'}</span>
                <span>{getNativeName(lang.code, language)}</span>
                <span className="text-xs text-muted-foreground">
                  ({lang.channelCount})
                </span>
              </button>
            ))}

            {!showMore && moreLangs.length > 0 && (
              <button
                onClick={() => setShowMore(true)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                {t('common.more')}
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

function getNativeName(code: string, _uiLang: LanguageCode): string {
  const names: Record<string, string> = {
    en: 'English', tr: 'Türkçe', ru: 'Русский', zh: '中文',
    id: 'Indonesia', vi: 'Tiếng Việt', es: 'Español', ar: 'العربية',
    de: 'Deutsch', fr: 'Français',
  };
  return names[code] || code.toUpperCase();
}
