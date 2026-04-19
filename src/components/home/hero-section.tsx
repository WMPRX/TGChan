'use client';

import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { Search, Users, Tv, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';

interface Stats {
  totalChannels: number;
  totalMembers: number;
  totalCategories: number;
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  return <span ref={ref}>{formatNum(count)}{suffix}</span>;
}

export function HeroSection({ stats }: { stats: Stats | null }) {
  const { t } = useI18n();
  const { setCurrentView, setSearchQuery } = useAppStore();
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput);
      setCurrentView('search');
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#229ED9]/10 via-[#229ED9]/5 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {t('home.heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            {t('home.heroSubtitle')}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('home.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full h-12 pl-12 pr-24 rounded-xl border bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-[#229ED9] focus:border-transparent text-base"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-1.5 top-1.5 bg-[#229ED9] hover:bg-[#1a8bc4] h-9 px-4"
            >
              {t('common.search')}
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#229ED9]/10 flex items-center justify-center">
                <Tv className="h-5 w-5 text-[#229ED9]" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">
                  <AnimatedCounter target={stats?.totalChannels || 0} />
                </div>
                <div className="text-xs text-muted-foreground">{t('home.totalChannels')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">
                  <AnimatedCounter target={stats?.totalMembers || 0} />
                </div>
                <div className="text-xs text-muted-foreground">{t('home.totalMembers')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">
                  <AnimatedCounter target={stats?.totalCategories || 0} suffix="+" />
                </div>
                <div className="text-xs text-muted-foreground">{t('header.categories')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
