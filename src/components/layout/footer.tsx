'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { useSiteSettings, resolveI18nField } from '@/lib/hooks/use-site-settings';
import { Separator } from '@/components/ui/separator';

interface CategoryItem {
  id: number;
  name: string; // JSON i18n string
  slug: string;
}

const DEFAULT_QUICK_LINKS = [
  { label: 'Home', url: '/home' },
  { label: 'Channels', url: '/channels' },
  { label: 'Groups', url: '/groups' },
  { label: 'Categories', url: '/categories' },
  { label: 'Premium', url: '/premium' },
];

export function Footer() {
  const { t, language } = useI18n();
  const { navigate } = useAppStore();
  const { settings } = useSiteSettings();

  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setCategories(data.slice(0, 8));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve dynamic site name
  const siteName = settings
    ? resolveI18nField(settings.siteName, language) || settings.siteName || 'TG Directory'
    : 'TG Directory';

  // Resolve dynamic about text
  const aboutText = settings
    ? resolveI18nField(settings.footerAbout, language) || t('footer.aboutText')
    : t('footer.aboutText');

  // Resolve dynamic copyright text
  const copyrightText = settings
    ? resolveI18nField(settings.footerText, language) || t('footer.copyright')
    : t('footer.copyright');

  // Resolve dynamic address
  const addressText = settings ? resolveI18nField(settings.address, language) : '';

  // Quick links: use dynamic or fall back to defaults
  const quickLinks =
    settings?.footerQuickLinks && settings.footerQuickLinks.length > 0
      ? settings.footerQuickLinks
      : DEFAULT_QUICK_LINKS.map((link) => ({
          label: t(
            `header.${link.label.toLowerCase()}` as Parameters<typeof t>[0]
          ),
          url: link.url,
        }));

  // Social links derived from settings
  const socialLinks = settings
    ? [
        {
          url: settings.socialTelegram,
          label: 'Telegram',
          icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          ),
        },
        {
          url: settings.twitterUrl || settings.socialTwitter,
          label: 'Twitter / X',
          icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          ),
        },
        {
          url: settings.facebookUrl,
          label: 'Facebook',
          icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          ),
        },
        {
          url: settings.instagramUrl,
          label: 'Instagram',
          icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          ),
        },
        {
          url: settings.linkedinUrl,
          label: 'LinkedIn',
          icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          ),
        },
        {
          url: settings.youtubeUrl,
          label: 'YouTube',
          icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          ),
        },
        {
          url: settings.tiktokUrl,
          label: 'TikTok',
          icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          ),
        },
        {
          url: settings.pinterestUrl,
          label: 'Pinterest',
          icon: (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
            </svg>
          ),
        },
      ].filter((s) => s.url && s.url.trim() !== '')
    : [];

  // Legal pages from settings
  const legalPages = settings?.legalPages && settings.legalPages.length > 0
    ? settings.legalPages
    : [];

  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {settings?.logo ? (
                <img
                  src={settings.logo}
                  alt={siteName}
                  className="w-7 h-7 rounded-md object-contain"
                />
              ) : (
                <div className="w-7 h-7 bg-[#229ED9] rounded-md flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                </div>
              )}
              <span className="font-bold">{siteName}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aboutText}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, idx) => (
                <li key={`${link.url}-${idx}`}>
                  <a
                    href={`#${link.url}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(link.url);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.categories')}</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <a
                    href={`#/category/${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/category/${cat.slug}`);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {resolveI18nField(cat.name, language)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.contact')}</h3>
            {/* Contact Info */}
            {(settings?.phone?.trim() || settings?.email?.trim() || addressText?.trim()) ? (
              <ul className="space-y-3">
                {/* Phone */}
                {settings?.phone && settings.phone.trim() !== '' && (
                  <li>
                    <a
                      href={`tel:${settings.phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {settings.phone}
                    </a>
                  </li>
                )}
                {/* Email */}
                {settings?.email && settings.email.trim() !== '' && (
                  <li>
                    <a
                      href={`mailto:${settings.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      {settings.email}
                    </a>
                  </li>
                )}
                {/* Address */}
                {addressText && addressText.trim() !== '' && (
                  <li>
                    <span className="flex items-start gap-2 text-sm text-muted-foreground">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {addressText}
                    </span>
                  </li>
                )}
              </ul>
            ) : null}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className={settings?.phone?.trim() || settings?.email?.trim() || addressText?.trim() ? 'mt-4' : ''}>
                <h4 className="text-sm font-medium mb-3">{t('footer.social')}</h4>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title={social.label}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback when no contact info and no social links */}
            {!settings?.phone?.trim() && !settings?.email?.trim() && !addressText?.trim() && socialLinks.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('footer.aboutText')}</p>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {copyrightText}
          </p>
          <div className="flex items-center gap-4">
            {legalPages.length > 0 ? (
              legalPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => navigate(`/legal/${page.slug}`)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {page.title}
                </button>
              ))
            ) : (
              <>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.privacy')}
                </button>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.terms')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
