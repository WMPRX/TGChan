'use client';

import { create } from 'zustand';

export type ViewMode = 'home' | 'channels' | 'groups' | 'categories' | 'premium' | 'dashboard' | 'admin' | 'channel-detail' | 'search';
export type AuthModal = 'login' | 'register' | null;
export type DashboardTab = 'channels' | 'add-channel' | 'premium' | 'settings';
export type AdminTab = 'dashboard' | 'channels' | 'submissions' | 'categories' | 'users' | 'premium' | 'settings' | 'telegram' | 'comments' | 'seo';
export type SeoSubTab = 'dashboard' | 'global' | 'templates' | 'pages' | 'sitemap' | 'robots' | 'structured-data' | 'redirects' | 'broken-links' | 'analytics' | 'keywords' | 'audit' | 'advanced';

interface UserInfo {
  id: number;
  email: string;
  name: string;
  username: string;
  role: string;
  avatar: string | null;
}

interface AppState {
  // Navigation (synced with URL hash)
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  navigate: (path: string) => void;

  // Auth
  authModal: AuthModal;
  setAuthModal: (modal: AuthModal) => void;
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;

  // Channel Detail
  selectedChannelId: number | null;
  setSelectedChannelId: (id: number | null) => void;

  // Category
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;

  // Language filter (for channel listing)
  languageFilter: string;
  setLanguageFilter: (lang: string) => void;

  // Sort
  sortBy: 'members' | 'growth' | 'newest';
  setSortBy: (sort: AppState['sortBy']) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Dashboard
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;

  // Admin
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;

  // SEO Sub-tab
  seoSubTab: SeoSubTab;
  setSeoSubTab: (tab: SeoSubTab) => void;
}

// Load user from localStorage
function getStoredUser(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('tg-directory-user');
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

// Parse hash URL into view state
function parseHash(hash: string): { view: ViewMode; channelId: number | null; categorySlug: string | null; searchQuery: string } {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);

  if (parts.length === 0) return { view: 'home', channelId: null, categorySlug: null, searchQuery: '' };

  const first = parts[0];

  // /channel/5
  if (first === 'channel' && parts[1]) {
    return { view: 'channel-detail', channelId: parseInt(parts[1]) || null, categorySlug: null, searchQuery: '' };
  }

  // /category/tech
  if (first === 'category' && parts[1]) {
    return { view: 'channels', channelId: null, categorySlug: parts[1], searchQuery: '' };
  }

  // /search?q=crypto
  if (first === 'search') {
    const params = new URLSearchParams(parts.slice(1).join('&').includes('=') ? parts.slice(1).join('&') : '');
    return { view: 'search', channelId: null, categorySlug: null, searchQuery: params.get('q') || '' };
  }

  const viewMap: Record<string, ViewMode> = {
    home: 'home',
    channels: 'channels',
    groups: 'groups',
    categories: 'categories',
    premium: 'premium',
    dashboard: 'dashboard',
    admin: 'admin',
  };

  return { view: viewMap[first] || 'home', channelId: null, categorySlug: null, searchQuery: '' };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  setCurrentView: (view) => {
    set({ currentView: view });
    // Update URL hash
    if (typeof window !== 'undefined') {
      const state = get();
      let hash = '#/' + view;
      if (view === 'channel-detail' && state.selectedChannelId) {
        hash = '#/channel/' + state.selectedChannelId;
      }
      if (hash !== window.location.hash) {
        window.history.pushState(null, '', hash);
      }
    }
  },
  navigate: (path: string) => {
    if (typeof window !== 'undefined') {
      const hash = path.startsWith('#') ? path : '#' + path;
      window.history.pushState(null, '', hash);
      const parsed = parseHash(hash);
      const updates: Partial<AppState> = { currentView: parsed.view };
      if (parsed.channelId !== null) updates.selectedChannelId = parsed.channelId;
      if (parsed.categorySlug !== null) updates.selectedCategorySlug = parsed.categorySlug;
      if (parsed.searchQuery) updates.searchQuery = parsed.searchQuery;
      set(updates);
    }
  },

  authModal: null,
  setAuthModal: (modal) => set({ authModal: modal }),
  user: null,
  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('tg-directory-user', JSON.stringify(user));
      } else {
        localStorage.removeItem('tg-directory-user');
      }
    }
    set({ user });
  },

  selectedChannelId: null,
  setSelectedChannelId: (id) => set({ selectedChannelId: id }),

  selectedCategorySlug: null,
  setSelectedCategorySlug: (slug) => set({ selectedCategorySlug: slug }),

  languageFilter: 'global',
  setLanguageFilter: (lang) => set({ languageFilter: lang }),

  sortBy: 'members',
  setSortBy: (sort) => set({ sortBy: sort }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  dashboardTab: 'channels',
  setDashboardTab: (tab) => set({ dashboardTab: tab }),

  adminTab: 'dashboard',
  setAdminTab: (tab) => set({ adminTab: tab }),

  seoSubTab: 'dashboard',
  setSeoSubTab: (tab) => set({ seoSubTab: tab }),
}));

// Initialize from URL hash and localStorage on client
if (typeof window !== 'undefined') {
  const storedUser = getStoredUser();
  const parsed = parseHash(window.location.hash);
  const updates: Partial<AppState> = { currentView: parsed.view };
  if (parsed.channelId !== null) updates.selectedChannelId = parsed.channelId;
  if (parsed.categorySlug !== null) updates.selectedCategorySlug = parsed.categorySlug;
  if (parsed.searchQuery) updates.searchQuery = parsed.searchQuery;
  if (storedUser) updates.user = storedUser;
  useAppStore.setState(updates);

  // Listen for browser back/forward
  window.addEventListener('popstate', () => {
    const p = parseHash(window.location.hash);
    const u: Partial<AppState> = { currentView: p.view };
    if (p.channelId !== null) u.selectedChannelId = p.channelId;
    if (p.categorySlug !== null) u.selectedCategorySlug = p.categorySlug;
    if (p.searchQuery) u.searchQuery = p.searchQuery;
    useAppStore.setState(u);
  });
}
