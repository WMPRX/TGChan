'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { useSiteSettings } from '@/lib/hooks/use-site-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/types';
import {
  Search,
  Moon,
  Sun,
  Globe,
  Menu,
  Plus,
  Crown,
  Settings,
  LogOut,
  LayoutDashboard,
  Shield,
  X,
  Phone,
  Send,
  MessageCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';

export function Header() {
  const { t, language, setLanguage } = useI18n();
  const { currentView, navigate, setAuthModal, user, setUser, searchQuery, setSearchQuery } = useAppStore();
  const { resolvedTheme, setTheme } = useTheme();
  const { settings, resolve } = useSiteSettings();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic site name from settings, with i18n resolution
  const siteName = resolve(settings?.siteName, language) || settings?.siteName || 'TG Directory';

  // Social links from settings (only those with values)
  const socialLinks = useMemo(() => {
    if (!settings) return [];
    const links: Array<{ key: string; label: string; href: string; icon: React.ReactNode }> = [];
    if (settings.socialTelegram) {
      links.push({ key: 'telegram', label: 'Telegram', href: settings.socialTelegram, icon: <Send className="h-4 w-4" /> });
    }
    if (settings.socialTwitter) {
      links.push({ key: 'twitter', label: 'Twitter / X', href: settings.socialTwitter, icon: <MessageCircle className="h-4 w-4" /> });
    }
    if (settings.twitterUrl) {
      links.push({ key: 'twitterUrl', label: 'X (Twitter)', href: settings.twitterUrl, icon: <MessageCircle className="h-4 w-4" /> });
    }
    if (settings.facebookUrl) {
      links.push({ key: 'facebook', label: 'Facebook', href: settings.facebookUrl, icon: <Globe className="h-4 w-4" /> });
    }
    if (settings.instagramUrl) {
      links.push({ key: 'instagram', label: 'Instagram', href: settings.instagramUrl, icon: <Globe className="h-4 w-4" /> });
    }
    if (settings.youtubeUrl) {
      links.push({ key: 'youtube', label: 'YouTube', href: settings.youtubeUrl, icon: <Globe className="h-4 w-4" /> });
    }
    if (settings.linkedinUrl) {
      links.push({ key: 'linkedin', label: 'LinkedIn', href: settings.linkedinUrl, icon: <Globe className="h-4 w-4" /> });
    }
    if (settings.tiktokUrl) {
      links.push({ key: 'tiktok', label: 'TikTok', href: settings.tiktokUrl, icon: <Globe className="h-4 w-4" /> });
    }
    if (settings.socialDiscord) {
      links.push({ key: 'discord', label: 'Discord', href: settings.socialDiscord, icon: <MessageCircle className="h-4 w-4" /> });
    }
    return links;
  }, [settings]);

  const navItems = [
    { key: 'home', label: t('header.home'), path: '/home' },
    { key: 'channels', label: t('header.channels'), path: '/channels' },
    { key: 'groups', label: t('header.groups'), path: '/groups' },
    { key: 'categories', label: t('header.categories'), path: '/categories' },
    { key: 'premium', label: t('header.premium'), path: '/premium' },
  ];

  const handleLogout = () => {
    setUser(null);
    navigate('/home');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="#/home"
              onClick={(e) => { e.preventDefault(); navigate('/home'); }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {settings?.logo ? (
                <img
                  src={settings.logo}
                  alt={siteName}
                  className="w-8 h-8 rounded-lg object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-[#229ED9] rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </div>
              )}
              <span className="font-bold text-lg hidden sm:block">{siteName}</span>
            </a>
          </div>

          {/* Desktop Navigation - using <a> tags for proper links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={`#${item.path}`}
                onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  ['home', 'channels', 'groups', 'categories', 'premium', 'channel-detail', 'search'].includes(currentView) && (
                    (item.key === 'home' && (currentView === 'home' || currentView === 'channel-detail')) ||
                    item.key === currentView
                  )
                    ? 'text-[#229ED9] bg-[#229ED9]/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className={`${searchOpen ? 'flex' : 'hidden md:flex'} items-center`}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('header.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px] lg:w-[280px] h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      useAppStore.setState({ searchQuery: e.currentTarget.value });
                      navigate('/search');
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>

            {!searchOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as LanguageCode)}
                    className={language === lang.code ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    {language === lang.code && (
                      <span className="ml-auto text-xs text-[#229ED9]">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="shrink-0"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Phone link */}
            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden lg:inline">{settings.phone}</span>
              </a>
            )}

            {/* Auth / User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-[#229ED9] text-white">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('header.dashboard')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigate('/dashboard'); useAppStore.setState({ dashboardTab: 'add-channel' }); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('header.addChannel')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigate('/dashboard'); useAppStore.setState({ dashboardTab: 'premium' }); }}>
                    <Crown className="mr-2 h-4 w-4" />
                    {t('header.premium')}
                  </DropdownMenuItem>
                  {user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      {t('header.admin')}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  {/* Social links in user dropdown */}
                  {socialLinks.length > 0 && (
                    <>
                      {socialLinks.map((link) => (
                        <DropdownMenuItem key={link.key} asChild>
                          <a href={link.href} target="_blank" rel="noopener noreferrer">
                            {link.icon}
                            <span className="ml-2">{link.label}</span>
                          </a>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => { navigate('/dashboard'); useAppStore.setState({ dashboardTab: 'settings' }); }}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('header.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('header.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthModal('login')}
                  className="hidden sm:flex"
                >
                  {t('header.login')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setAuthModal('register')}
                  className="bg-[#229ED9] hover:bg-[#1a8bc4]"
                >
                  {t('header.register')}
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="sr-only">{t('header.menu')}</SheetTitle>
                <div className="flex flex-col gap-4 mt-8">
                  {/* Mobile phone link */}
                  {settings?.phone && (
                    <a
                      href={`tel:${settings.phone}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors sm:hidden"
                    >
                      <Phone className="h-4 w-4" />
                      {settings.phone}
                    </a>
                  )}
                  {navItems.map((item) => (
                    <a
                      key={item.key}
                      href={`#${item.path}`}
                      onClick={(e) => { e.preventDefault(); navigate(item.path); setMobileMenuOpen(false); }}
                      className={`px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                        currentView === item.key
                          ? 'text-[#229ED9] bg-[#229ED9]/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                  {/* Social links in mobile menu */}
                  {socialLinks.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('footer.contact')}</p>
                      {socialLinks.map((link) => (
                        <a
                          key={link.key}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.icon}
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                  {!user && (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" onClick={() => { setAuthModal('login'); setMobileMenuOpen(false); }}>
                        {t('header.login')}
                      </Button>
                      <Button className="bg-[#229ED9] hover:bg-[#1a8bc4]" onClick={() => { setAuthModal('register'); setMobileMenuOpen(false); }}>
                        {t('header.register')}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
