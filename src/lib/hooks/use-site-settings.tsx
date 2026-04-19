'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// ==================== Types ====================

export interface LegalPageSummary {
  id: number;
  title: string;
  slug: string;
  pageType: string;
  heroImage: string | null;
}

export interface CookieConsentSettings {
  enabled: boolean;
  position: string;
  theme: string;
  message: Record<string, string> | null;
  acceptText: Record<string, string> | null;
  rejectText: Record<string, string> | null;
  settingsText: Record<string, string> | null;
  policyUrl: string;
  categories: unknown;
}

export interface SiteSettingsData {
  // SiteSettings
  siteName: string;
  siteDescription: string | null;
  logo: string | null;
  favicon: string | null;
  defaultLanguage: string;
  supportedLanguages: string[];
  maintenanceMode: boolean;
  adsEnabled: boolean;
  socialTelegram: string;
  socialTwitter: string;
  socialDiscord: string;
  metaKeywords: string | null;
  metaDescription: string | null;
  footerText: string | null;
  analyticsId: string | null;

  // GeneralSettings
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string | null;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  pinterestUrl: string;
  googleMapsUrl: string;
  yandexMapsUrl: string;
  footerAbout: string | null;
  footerQuickLinks: Array<{ label: string; url: string }>;
  footerActivityLinks: Array<{ label: string; url: string }>;

  // Legal pages
  legalPages: LegalPageSummary[];

  // Cookie consent
  cookieConsent: CookieConsentSettings | null;
}

interface SiteSettingsContextValue {
  settings: SiteSettingsData | null;
  loading: boolean;
  refresh: (force?: boolean) => Promise<void>;
  resolve: (field: unknown, lang: string) => string;
}

// ==================== i18n resolve helper ====================

/**
 * Resolve a JSON i18n field value for the given language.
 * Accepts either a raw JSON string or an already-parsed object.
 * Fallback chain: requested lang → 'en' → 'tr' → first available key → raw string.
 */
export function resolveI18nField(field: unknown, lang: string): string {
  if (field === null || field === undefined) return '';

  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (typeof parsed === 'object' && parsed !== null) {
        return resolveObject(parsed, lang);
      }
      return String(parsed);
    } catch {
      return field;
    }
  }

  if (typeof field === 'object' && field !== null) {
    return resolveObject(field as Record<string, unknown>, lang);
  }

  return String(field);
}

function resolveObject(obj: Record<string, unknown>, lang: string): string {
  if (obj[lang] !== undefined && obj[lang] !== null) return String(obj[lang]);
  if (obj['en'] !== undefined && obj['en'] !== null) return String(obj['en']);
  if (obj['tr'] !== undefined && obj['tr'] !== null) return String(obj['tr']);
  const firstKey = Object.keys(obj)[0];
  if (firstKey && obj[firstKey] !== undefined && obj[firstKey] !== null) return String(obj[firstKey]);
  return '';
}

// ==================== Invalidate function ====================

/**
 * Invalidate the site settings cache both on the server and client side.
 * 1. Fetches /api/settings?invalidate=1 to clear server cache
 * 2. Dispatches 'site-settings-cache-invalidated' CustomEvent to trigger client refresh
 */
export async function invalidateSiteSettingsCache(): Promise<void> {
  try {
    await fetch('/api/settings?invalidate=1');
  } catch {
    // Silently fail - the client event will still trigger a re-fetch
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('site-settings-cache-invalidated'));
  }
}

// ==================== Context ====================

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

// ==================== Provider ====================

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchInProgress = useRef(false);
  const pendingInvalidation = useRef(false);

  const fetchSettings = useCallback(async (force = false) => {
    // Avoid concurrent fetches unless forced (e.g. cache invalidation)
    if (fetchInProgress.current && !force) return;
    fetchInProgress.current = true;
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data as SiteSettingsData);
      }
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
      // If an invalidation happened while we were fetching, fetch again
      if (pendingInvalidation.current) {
        pendingInvalidation.current = false;
        fetchSettings(true);
      }
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Listen for cache invalidation events and re-fetch
  useEffect(() => {
    const handleInvalidation = () => {
      if (fetchInProgress.current) {
        // Mark that we need to re-fetch once the current fetch completes
        pendingInvalidation.current = true;
      } else {
        fetchSettings(true);
      }
    };
    window.addEventListener('site-settings-cache-invalidated', handleInvalidation);
    return () => {
      window.removeEventListener('site-settings-cache-invalidated', handleInvalidation);
    };
  }, [fetchSettings]);

  const resolve = useCallback((field: unknown, lang: string): string => {
    return resolveI18nField(field, lang);
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh: fetchSettings, resolve }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// ==================== Hook ====================

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return ctx;
}
