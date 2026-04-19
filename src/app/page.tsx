'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { Tv, Users, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load heavy components to reduce initial compilation memory
const Header = dynamic(() => import('@/components/layout/header').then(m => ({ default: m.Header })), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/footer').then(m => ({ default: m.Footer })), { ssr: false });
const AuthModals = dynamic(() => import('@/components/auth/auth-modals').then(m => ({ default: m.AuthModals })), { ssr: false });
const DashboardView = dynamic(() => import('@/components/views/dashboard-view'), { ssr: false });
const AdminView = dynamic(() => import('@/components/views/admin-view').then(m => ({ default: m.AdminView })), { ssr: false });
const ChannelDetail = dynamic(() => import('@/components/channel/channel-detail').then(m => ({ default: m.ChannelDetail })), { ssr: false });

interface Channel {
  id: number;
  username: string;
  title: string;
  description: string | null;
  type: string;
  avatarUrl: string | null;
  memberCount: number;
  language: string;
  isVerified: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  hasBadge: boolean;
  highlightColor: string | null;
  rank: number | null;
  previousRank: number | null;
  dailyGrowth: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  category: { id: number; name: string; slug: string; icon: string | null } | null;
  tags: { id: number; name: string; slug: string }[];
}

export default function Home() {
  const { t } = useI18n();
  const {
    currentView,
    languageFilter, sortBy, setSortBy,
    searchQuery,
    selectedChannelId, setSelectedChannelId,
    selectedCategorySlug,
    user,
    navigate,
  } = useAppStore();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string; icon: string | null; channelCount: number }>>([]);
  const [channelDetail, setChannelDetail] = useState<Channel | null>(null);
  const [stats, setStats] = useState<{ totalChannels: number; totalMembers: number; totalCategories: number } | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [channelLoading, setChannelLoading] = useState(false);

  // Fetch channel detail when selectedChannelId changes
  useEffect(() => {
    if (selectedChannelId && currentView === 'channel-detail') {
      setChannelLoading(true);
      fetch(`/api/channels/${selectedChannelId}`)
        .then(r => r.json())
        .then(data => setChannelDetail(data.channel || null))
        .catch(() => setChannelDetail(null))
        .finally(() => setChannelLoading(false));
    } else {
      setChannelDetail(null);
    }
  }, [selectedChannelId, currentView]);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        language: languageFilter,
        sort: sortBy,
        page: page.toString(),
        limit: '50',
      });
      if (currentView === 'groups') params.set('type', 'GROUP');
      if (currentView === 'search' && searchQuery) params.set('search', searchQuery);
      if (selectedCategorySlug) params.set('category', selectedCategorySlug);

      const res = await fetch(`/api/channels?${params}`);
      const data = await res.json();
      setChannels(data.channels || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Fetch channels error:', err);
    } finally {
      setLoading(false);
    }
  }, [languageFilter, sortBy, page, currentView, searchQuery, selectedCategorySlug]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  }, []);

  const fetchLanguageStats = useCallback(async () => {
    try {
      const res = await fetch('/api/languages');
      const data = await res.json();
      setStats({ totalChannels: data.totalChannels, totalMembers: data.totalMembers, totalCategories: categories.length });
    } catch (err) {
      console.error('Fetch languages error:', err);
    }
  }, [categories.length]);

  useEffect(() => { fetchCategories(); fetchLanguageStats(); }, [fetchCategories, fetchLanguageStats]);
  useEffect(() => {
    if (['home', 'channels', 'groups', 'search', 'categories'].includes(currentView)) {
      fetchChannels();
    }
  }, [currentView, fetchChannels]);
  useEffect(() => { setPage(1); }, [languageFilter, sortBy, searchQuery, selectedCategorySlug]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {renderView()}
      </main>
      <Footer />
      <AuthModals />
    </div>
  );

  function renderView() {
    switch (currentView) {
      case 'home':
      case 'channels':
      case 'groups':
        return (
          <HomeView
            stats={stats}
            channels={channels}
            categories={categories}
            loading={loading}
            total={total}
            page={page}
            totalPages={totalPages}
            sortBy={sortBy}
            setSortBy={setSortBy}
            setPage={setPage}
            languageFilter={languageFilter}
            currentView={currentView}
            t={t}
          />
        );
      case 'channel-detail':
        return channelLoading ? (
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
            <div className="space-y-4">
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 bg-muted animate-pulse rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
              </div>
            </div>
          </div>
        ) : <ChannelDetail channel={channelDetail} />;
      case 'categories':
        return <CategoriesView categories={categories} t={t} />;
      case 'search':
        return (
          <SearchView
            channels={channels}
            loading={loading}
            total={total}
            page={page}
            totalPages={totalPages}
            sortBy={sortBy}
            setSortBy={setSortBy}
            setPage={setPage}
            searchQuery={searchQuery}
            t={t}
          />
        );
      case 'premium':
        return <PremiumView t={t} />;
      case 'dashboard':
        return user ? <DashboardView /> : <div className="text-center py-20 text-muted-foreground">{t('auth.login')}</div>;
      case 'admin':
        return user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') ? <AdminView /> : <div className="text-center py-20 text-muted-foreground">Access Denied</div>;
      default:
        return null;
    }
  }
}

// ---- Inline lightweight view components ----

function HomeView({ stats, channels, categories, loading, total, page, totalPages, sortBy, setSortBy, setPage, languageFilter, currentView, t }: {
  stats: { totalChannels: number; totalMembers: number } | null;
  channels: Channel[];
  categories: Array<{ id: number; name: string; slug: string; icon: string | null; channelCount: number }>;
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  sortBy: string;
  setSortBy: (s: 'members' | 'growth' | 'newest') => void;
  setPage: (p: number) => void;
  languageFilter: string;
  currentView: string;
  t: (k: string) => string;
}) {
  const { navigate, setSelectedCategorySlug, setLanguageFilter } = useAppStore();

  return (
    <>
      {/* Hero Section */}
      {currentView === 'home' && (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#229ED9]/10 via-[#229ED9]/5 to-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-20">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{t('home.heroTitle')}</h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">{t('home.heroSubtitle')}</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                <StatBox label={t('home.totalChannels')} value={stats?.totalChannels || 0} color="text-[#229ED9]" icon={Tv} />
                <StatBox label={t('home.totalMembers')} value={stats?.totalMembers || 0} color="text-green-500" icon={Users} />
                <StatBox label={t('header.categories')} value={stats?.totalCategories || 0} color="text-orange-500" icon={TrendingUp} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Tabs */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            <button onClick={() => setLanguageFilter('global')} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${languageFilter === 'global' ? 'text-[#229ED9] bg-[#229ED9]/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
              🌐 {t('home.languageTabs.global')}
            </button>
            {['en','tr','ru','zh','id','es','ar','de','fr','vi'].map(code => (
              <button key={code} onClick={() => setLanguageFilter(code)} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${languageFilter === code ? 'text-[#229ED9] bg-[#229ED9]/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Bar + Channel List */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {(['members', 'growth', 'newest'] as const).map(sort => (
              <button key={sort} onClick={() => setSortBy(sort)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === sort ? 'text-[#229ED9] bg-[#229ED9]/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
                {t(`home.sort.${sort}`)}
              </button>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">{total} {t('home.channelsCount')}</div>
        </div>

        {/* Sponsored Banner */}
        <div className="mx-auto max-w-7xl px-0 mb-2">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-4 sm:p-6 cursor-pointer" onClick={() => navigate('/premium')}>
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <p className="font-bold text-amber-900 text-sm sm:text-base">{t('home.sponsored')} — {t('premium.subtitle')}</p>
                </div>
              </div>
              <button className="shrink-0 px-4 py-2 bg-amber-900 text-amber-100 rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors">{t('premium.cta')}</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="h-5 w-8 bg-muted animate-pulse rounded" />
                <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <ChannelList channels={channels} t={t} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">{total} {t('home.channelsCount')}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-50">←</button>
              <span className="text-sm font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 text-sm border rounded-md disabled:opacity-50">→</button>
            </div>
          </div>
        )}
      </div>

      {/* Categories Grid */}
      {currentView === 'home' && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold mb-6">{t('home.popularCategories')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map(cat => {
              const displayName = parseCatName(cat.name);
              return (
                <button key={cat.id} onClick={() => { setSelectedCategorySlug(cat.slug); navigate('/channels'); }} className="group flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:shadow-md hover:border-[#229ED9]/30 hover:scale-[1.02] transition-all duration-200">
                  <span className="text-2xl">{cat.icon || '📁'}</span>
                  <span className="text-sm font-medium text-center leading-tight">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{cat.channelCount} {t('categories.channelCount')}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function ChannelList({ channels, t }: { channels: Channel[]; t: (k: string) => string }) {
  const { navigate } = useAppStore();

  const openChannel = (ch: Channel) => {
    navigate(`/channel/${ch.id}`);
  };

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-3 text-left w-12">#</th>
              <th className="py-3 px-3 text-left">NAME</th>
              <th className="py-3 px-3 text-right">MEMBERS</th>
              <th className="py-3 px-3 text-center w-24">LANG</th>
              <th className="py-3 px-3 text-center w-20">CHANGE</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, idx) => {
              const rankChange = getRankChange(ch.rank, ch.previousRank);
              return (
                <tr key={ch.id} onClick={() => openChannel(ch)} className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${ch.isPremium ? 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20' : ''}`} style={ch.isPremium && ch.highlightColor ? { borderLeft: `3px solid ${ch.highlightColor}` } : undefined}>
                  <td className="py-3 px-3">
                    <span className="text-sm font-medium text-muted-foreground">{idx + 1}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ backgroundColor: stringToColor(ch.username) }}>{getInitials(ch.title)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">{ch.title}</span>
                          {ch.isVerified && <span className="text-[#229ED9] text-sm">✓</span>}
                          {ch.isPremium && <span className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">PRO</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">@{ch.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right"><span className="text-sm font-medium">{fmtCount(ch.memberCount)}</span></td>
                  <td className="py-3 px-3 text-center"><span className="text-xs font-medium border rounded px-1.5 py-0.5">{ch.language.toUpperCase()}</span></td>
                  <td className="py-3 px-3 text-center">
                    {rankChange.direction === 'up' && <span className="text-xs font-medium text-green-500">▲{rankChange.value}</span>}
                    {rankChange.direction === 'down' && <span className="text-xs font-medium text-red-500">▼{rankChange.value}</span>}
                    {rankChange.direction === 'same' && <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y">
        {channels.map((ch, idx) => {
          const rankChange = getRankChange(ch.rank, ch.previousRank);
          return (
            <div key={ch.id} onClick={() => openChannel(ch)} className={`flex items-center gap-3 py-3 px-4 cursor-pointer active:bg-muted/50 ${ch.isPremium ? 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20' : ''}`}>
              <span className="text-sm font-medium text-muted-foreground w-6 text-center">{idx + 1}</span>
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ backgroundColor: stringToColor(ch.username) }}>{getInitials(ch.title)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm truncate">{ch.title}</span>
                  {ch.isVerified && <span className="text-[#229ED9] text-sm">✓</span>}
                </div>
                <div className="text-xs text-muted-foreground">@{ch.username}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-medium">{fmtCount(ch.memberCount)}</div>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[10px] border rounded px-1 py-0">{ch.language.toUpperCase()}</span>
                  {rankChange.direction === 'up' && <span className="text-green-500 text-xs">↑</span>}
                  {rankChange.direction === 'down' && <span className="text-red-500 text-xs">↓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SearchView({ channels, loading, total, page, totalPages, sortBy, setSortBy, setPage, searchQuery, t }: {
  channels: Channel[]; loading: boolean; total: number; page: number; totalPages: number;
  sortBy: string; setSortBy: (s: 'members' | 'growth' | 'newest') => void; setPage: (p: number) => void;
  searchQuery: string; t: (k: string) => string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <h2 className="text-xl font-bold mb-2">{t('search.title')}: &quot;{searchQuery}&quot;</h2>
      <div className="flex items-center gap-2 mb-4">
        {(['members', 'growth', 'newest'] as const).map(sort => (
          <button key={sort} onClick={() => setSortBy(sort)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === sort ? 'text-[#229ED9] bg-[#229ED9]/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>{t(`home.sort.${sort}`)}</button>
        ))}
      </div>
      {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 w-full bg-muted animate-pulse rounded" />)}</div> : channels.length > 0 ? <ChannelList channels={channels} t={t} /> : <div className="text-center py-20 text-muted-foreground">{t('search.noResults')}</div>}
    </div>
  );
}

function CategoriesView({ categories, t }: { categories: Array<{ id: number; name: string; slug: string; icon: string | null; channelCount: number }>; t: (k: string) => string }) {
  const { navigate, setSelectedCategorySlug } = useAppStore();
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('categories.allCategories')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md hover:border-[#229ED9]/30 cursor-pointer transition-all" onClick={() => { setSelectedCategorySlug(cat.slug); navigate('/channels'); }}>
            <span className="text-3xl">{cat.icon || '📁'}</span>
            <div>
              <div className="font-semibold">{parseCatName(cat.name) || cat.slug}</div>
              <div className="text-sm text-muted-foreground">{cat.channelCount} {t('categories.channelCount')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PremiumView({ t }: { t: (k: string) => string }) {
  return (
    <div>
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 py-16">
        <div className="mx-auto max-w-4xl text-center px-4">
          <span className="text-5xl block mb-4">👑</span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('premium.title')}</h1>
          <p className="text-lg text-muted-foreground">{t('premium.subtitle')}</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: t('premium.bronze'), price: '$9.99', days: 7, features: [t('premium.topPosition'), '1 ' + t('channels.channel')] },
            { name: t('premium.silver'), price: '$29.99', days: 30, features: [t('premium.topPosition'), t('premium.featuredBadge'), '2 ' + t('channels.channel') + 's', t('premium.categoryPriority')] },
            { name: t('premium.gold'), price: '$74.99', days: 90, popular: true, features: [t('premium.topPosition'), t('premium.featuredBadge'), t('premium.highlightColor'), '3 ' + t('channels.channel') + 's', t('premium.categoryPriority'), t('premium.detailedStats')] },
            { name: t('premium.platinum'), price: '$249.99', days: 365, features: [t('premium.topPosition'), t('premium.featuredBadge'), t('premium.highlightColor'), '5 ' + t('channels.channel') + 's', t('premium.categoryPriority'), t('premium.detailedStats'), t('premium.sponsoredBanner')] },
          ].map(plan => (
            <div key={plan.name} className={`relative rounded-xl border p-6 bg-card ${plan.popular ? 'border-2 border-amber-500 shadow-lg' : ''}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-medium">Most Popular</div>}
              <h3 className="text-lg font-semibold text-center">{plan.name}</h3>
              <div className="text-center mt-2"><span className="text-3xl font-bold">{plan.price}</span><span className="text-sm text-muted-foreground">/{plan.days}d</span></div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full mt-4 py-2 rounded-lg text-white font-medium ${plan.popular ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#229ED9] hover:bg-[#1a8bc4]'}`}>{t('premium.buyNow')}</button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">{t('premium.faq.title')}</h2>
          <div className="space-y-4">
            {[
              { q: t('premium.faq.q1'), a: t('premium.faq.a1') },
              { q: t('premium.faq.q2'), a: t('premium.faq.a2') },
              { q: t('premium.faq.q3'), a: t('premium.faq.a3') },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border p-4 bg-card">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon?: React.ElementType }) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || value === 0) return;
    hasAnimated.current = true;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={`w-10 h-10 rounded-lg ${color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      )}
      <div className="text-left">
        <div className={`text-2xl font-bold ${color}`}>{fmtCount(display || value)}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// ---- Utility functions (inline to avoid import overhead) ----

function fmtCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toString();
}

function getRankChange(current: number | null, previous: number | null): { direction: 'up' | 'down' | 'same'; value: number } {
  if (current === null || previous === null) return { direction: 'same', value: 0 };
  const diff = previous - current;
  if (diff > 0) return { direction: 'up', value: diff };
  if (diff < 0) return { direction: 'down', value: Math.abs(diff) };
  return { direction: 'same', value: 0 };
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'];
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name.split(/[\s_-]+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function parseCatName(nameStr: string): string {
  try {
    const parsed = JSON.parse(nameStr);
    if (parsed && typeof parsed === 'object') return parsed.en || parsed[Object.keys(parsed)[0]] || nameStr;
    return nameStr;
  } catch {
    return nameStr;
  }
}
