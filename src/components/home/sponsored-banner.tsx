'use client';

import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { Crown } from 'lucide-react';

export function SponsoredBanner() {
  const { t } = useI18n();
  const { setCurrentView } = useAppStore();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-4 sm:p-6 my-2 cursor-pointer"
        onClick={() => setCurrentView('premium')}
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-amber-900 shrink-0" />
            <div>
              <p className="font-bold text-amber-900 text-sm sm:text-base">
                {t('home.sponsored')} — {t('premium.subtitle')}
              </p>
              <p className="text-amber-800/80 text-xs sm:text-sm">
                {t('premium.faq.a1')}
              </p>
            </div>
          </div>
          <button
            className="shrink-0 px-4 py-2 bg-amber-900 text-amber-100 rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors"
            onClick={(e) => { e.stopPropagation(); setCurrentView('premium'); }}
          >
            {t('premium.cta')}
          </button>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}
