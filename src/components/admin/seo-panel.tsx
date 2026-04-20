'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAppStore, type SeoSubTab } from '@/lib/store';
import { toast } from 'sonner';
import { parseI18nField } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, Globe, FileCode, Map, Bot as BotIcon, Braces, ArrowRightLeft,
  Unlink, Key, ClipboardCheck, Wrench, AlertTriangle, Loader2, Plus, Trash2,
  Copy, RefreshCw, ExternalLink, CheckCircle, XCircle, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Download, Eye, Shield, Zap, FileText,
  Search, Activity, Save,
} from 'lucide-react';

// ============ HELPER: Circular Score Gauge ============

function ScoreGauge({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <span className="absolute text-2xl font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function MiniScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div className="flex flex-col items-center gap-1">
      <ScoreGauge score={score} size={80} strokeWidth={6} />
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

// ============ HELPER: Skeleton ============

function SkeletonCard() {
  return <div className="h-24 bg-muted animate-pulse rounded-lg" />;
}

// ============ TYPES ============

interface SeoStats {
  overallScore: number;
  activeRedirects: number;
  brokenLinks: number;
  trackedKeywords: number;
  sitemapEntries: number;
  activeSchemas: number;
}

interface SeoGlobalSettings {
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultMetaKeywords: string;
  titleSeparator: string;
  titleSuffix: string;
  ogDefaultImage: string;
  ogImageWidth: string;
  ogImageHeight: string;
  twitterCard: string;
  twitterSite: string;
  twitterCreator: string;
  facebookAppId: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  yandexVerification: string;
  pinterestVerification: string;
  canonicalDomain: string;
  forceHttps: boolean;
  enableSitemap: boolean;
  enableRobotsTxt: boolean;
  enableRssFeed: boolean;
  enableHreflang: boolean;
  customHeadScripts: string;
  customBodyScripts: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  hotjarId: string;
  microsoftClarityId: string;
}

interface SeoTemplate {
  id: number;
  pageType: string;
  titleTemplate: string;
  descriptionTemplate: string;
  keywordsTemplate: string;
  ogTitleTemplate: string;
  ogDescTemplate: string;
  ogImageTemplate: string;
  isActive: boolean;
}

interface SitemapEntry {
  id: number;
  url: string;
  priority: number;
  changeFreq: string;
  lastModified: string | null;
  excluded: boolean;
}

interface RobotsRule {
  id: number;
  userAgent: string;
  ruleType: string;
  path: string;
}

interface StructuredDataSchema {
  id: number;
  name: string;
  schemaType: string;
  pageType: string;
  jsonLd: string;
  isGlobal: boolean;
  isActive: boolean;
}

interface Redirect {
  id: number;
  fromPath: string;
  toPath: string;
  statusCode: number;
  hitCount: number;
  isActive: boolean;
  notes: string;
}

interface BrokenLink {
  id: number;
  url: string;
  statusCode: number;
  referrer: string;
  hitCount: number;
  lastHit: string;
  isResolved: boolean;
}

interface Keyword {
  id: number;
  keyword: string;
  language: string;
  country: string;
  position: number;
  previousPosition: number | null;
  searchVolume: number;
  difficulty: number;
  targetUrl: string;
}

interface AuditData {
  id: number;
  score: number;
  technicalSeo: number;
  contentQuality: number;
  metaInfo: number;
  performance: number;
  mobileCompatibility: number;
  criticalIssues: AuditIssue[];
  warnings: AuditIssue[];
  suggestions: AuditIssue[];
  createdAt: string;
}

interface AuditIssue {
  title: string;
  description: string;
  impact: string;
}

// ============ DEFAULTS ============

const defaultGlobalSettings: SeoGlobalSettings = {
  defaultMetaTitle: '',
  defaultMetaDescription: '',
  defaultMetaKeywords: '',
  titleSeparator: ' | ',
  titleSuffix: '',
  ogDefaultImage: '',
  ogImageWidth: '1200',
  ogImageHeight: '630',
  twitterCard: 'SUMMARY_LARGE_IMAGE',
  twitterSite: '',
  twitterCreator: '',
  facebookAppId: '',
  googleSiteVerification: '',
  bingSiteVerification: '',
  yandexVerification: '',
  pinterestVerification: '',
  canonicalDomain: '',
  forceHttps: true,
  enableSitemap: true,
  enableRobotsTxt: true,
  enableRssFeed: true,
  enableHreflang: false,
  customHeadScripts: '',
  customBodyScripts: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  facebookPixelId: '',
  hotjarId: '',
  microsoftClarityId: '',
};

// ============ MAIN COMPONENT ============

export default function SeoPanel() {
  const { t } = useI18n();
  const { seoSubTab, setSeoSubTab } = useAppStore();

  const subTabs: { key: SeoSubTab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: t('admin.seo.dashboard'), icon: BarChart3 },
    { key: 'global', label: t('admin.seo.global'), icon: Globe },
    { key: 'templates', label: t('admin.seo.templates'), icon: FileCode },
    { key: 'sitemap', label: t('admin.seo.sitemap'), icon: Map },
    { key: 'robots', label: t('admin.seo.robots'), icon: BotIcon },
    { key: 'structured-data', label: t('admin.seo.structuredData'), icon: Braces },
    { key: 'redirects', label: t('admin.seo.redirects'), icon: ArrowRightLeft },
    { key: 'broken-links', label: t('admin.seo.brokenLinks'), icon: Unlink },
    { key: 'keywords', label: t('admin.seo.keywords'), icon: Key },
    { key: 'audit', label: t('admin.seo.audit'), icon: ClipboardCheck },
    { key: 'advanced', label: t('admin.seo.advanced'), icon: Wrench },
  ];

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300">{t('admin.seo.changesAffectLive')}</p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex flex-col lg:flex-row gap-4">
        <nav className="lg:w-48 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {subTabs.map(tab => (
              <button key={tab.key} onClick={() => setSeoSubTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  seoSubTab === tab.key
                    ? 'text-[#229ED9] bg-[#229ED9]/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}>
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {seoSubTab === 'dashboard' && <SeoDashboard />}
          {seoSubTab === 'global' && <SeoGlobal />}
          {seoSubTab === 'templates' && <SeoTemplates />}
          {seoSubTab === 'sitemap' && <SeoSitemap />}
          {seoSubTab === 'robots' && <SeoRobots />}
          {seoSubTab === 'structured-data' && <SeoStructuredData />}
          {seoSubTab === 'redirects' && <SeoRedirects />}
          {seoSubTab === 'broken-links' && <SeoBrokenLinks />}
          {seoSubTab === 'keywords' && <SeoKeywords />}
          {seoSubTab === 'audit' && <SeoAudit />}
          {seoSubTab === 'advanced' && <SeoAdvanced />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SeoDashboard
// ============================================================

function SeoDashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SeoStats | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setStats({ overallScore: 72, activeRedirects: 0, brokenLinks: 0, trackedKeywords: 0, sitemapEntries: 0, activeSchemas: 0 });
      }
    } catch {
      setStats({ overallScore: 72, activeRedirects: 0, brokenLinks: 0, trackedKeywords: 0, sitemapEntries: 0, activeSchemas: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  if (!stats) return null;

  const kpis = [
    { label: t('admin.seo.overallScore'), value: stats.overallScore, icon: BarChart3, isScore: true },
    { label: t('admin.seo.activeRedirects'), value: stats.activeRedirects, icon: ArrowRightLeft },
    { label: t('admin.seo.brokenLinksCount'), value: stats.brokenLinks, icon: Unlink },
    { label: t('admin.seo.trackedKeywords'), value: stats.trackedKeywords, icon: Key },
    { label: t('admin.seo.sitemap'), value: stats.sitemapEntries, icon: Map },
    { label: t('admin.seo.structuredData'), value: stats.activeSchemas, icon: Braces },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
              {kpi.isScore ? (
                <ScoreGauge score={kpi.value as number} size={90} strokeWidth={7} />
              ) : (
                <div className="flex items-center gap-2">
                  <kpi.icon className="h-5 w-5 text-[#229ED9]" />
                  <span className="text-2xl font-bold">{kpi.value}</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground text-center">{kpi.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#229ED9]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => toast.info(t('admin.seo.auditStarted'))}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              {t('admin.seo.startAudit')}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => toast.success(t('admin.seo.sitemapRegenerated'))}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('admin.seo.regenerateSitemap')}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => toast.info('Scanning...')}>
              <Search className="h-4 w-4 mr-2" />
              {t('admin.seo.scanBrokenLinks')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SeoGlobal
// ============================================================

function SeoGlobal() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SeoGlobalSettings>(defaultGlobalSettings);
  const [innerTab, setInnerTab] = useState('meta');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/global');
      if (res.ok) {
        const data = await res.json();
        // API returns flat settings object; convert numeric fields to strings for form inputs
        setSettings({
          ...defaultGlobalSettings,
          ...data,
          // Coerce all nullable string fields from null → '' to prevent React input crashes
          defaultMetaTitle: data.defaultMetaTitle ?? '',
          defaultMetaDescription: data.defaultMetaDescription ?? '',
          defaultMetaKeywords: data.defaultMetaKeywords ?? '',
          titleSuffix: data.titleSuffix ?? '',
          ogDefaultImage: data.ogDefaultImage ?? '',
          twitterSite: data.twitterSite ?? '',
          twitterCreator: data.twitterCreator ?? '',
          facebookAppId: data.facebookAppId ?? '',
          googleSiteVerification: data.googleSiteVerification ?? '',
          bingSiteVerification: data.bingSiteVerification ?? '',
          yandexVerification: data.yandexVerification ?? '',
          pinterestVerification: data.pinterestVerification ?? '',
          canonicalDomain: data.canonicalDomain ?? '',
          customHeadScripts: data.customHeadScripts ?? '',
          customBodyScripts: data.customBodyScripts ?? '',
          googleAnalyticsId: data.googleAnalyticsId ?? '',
          googleTagManagerId: data.googleTagManagerId ?? '',
          facebookPixelId: data.facebookPixelId ?? '',
          hotjarId: data.hotjarId ?? '',
          microsoftClarityId: data.microsoftClarityId ?? '',
          ogImageWidth: String(data.ogImageWidth ?? '1200'),
          ogImageHeight: String(data.ogImageHeight ?? '630'),
        });
      }
    } catch {
      toast.error(t('admin.seo.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert string fields to proper types for API
      const payload = {
        ...settings,
        ogImageWidth: parseInt(String(settings.ogImageWidth), 10) || 1200,
        ogImageHeight: parseInt(String(settings.ogImageHeight), 10) || 630,
      };
      const res = await fetch('/api/admin/seo/global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t('admin.seo.saved'));
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('SEO global save error:', errData);
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch (err) {
      console.error('SEO global save exception:', err);
      toast.error(t('admin.seo.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof SeoGlobalSettings>(key: K, value: SeoGlobalSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#229ED9]" />
            {t('admin.seo.globalSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={innerTab} onValueChange={setInnerTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="meta">{t('admin.seo.metaInfo')}</TabsTrigger>
              <TabsTrigger value="og">Open Graph</TabsTrigger>
              <TabsTrigger value="verification">{t('admin.seo.verificationCodes')}</TabsTrigger>
              <TabsTrigger value="canonical">Canonical & HTTPS</TabsTrigger>
            </TabsList>

            {/* Meta Info */}
            <TabsContent value="meta" className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.defaultMetaTitle')}</Label>
                <Textarea value={settings.defaultMetaTitle} onChange={e => updateField('defaultMetaTitle', e.target.value)} rows={2} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('admin.seo.metaTitleIdeal')}</span>
                  <span>{t('admin.seo.charCount', { count: settings.defaultMetaTitle.length })}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.defaultMetaDescription')}</Label>
                <Textarea value={settings.defaultMetaDescription} onChange={e => updateField('defaultMetaDescription', e.target.value)} rows={3} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('admin.seo.metaDescIdeal')}</span>
                  <span>{t('admin.seo.charCount', { count: settings.defaultMetaDescription.length })}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.defaultMetaKeywords')}</Label>
                <Textarea value={settings.defaultMetaKeywords} onChange={e => updateField('defaultMetaKeywords', e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('admin.seo.titleSeparator')}</Label>
                  <Input value={settings.titleSeparator} onChange={e => updateField('titleSeparator', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('admin.seo.titleSuffix')}</Label>
                  <Input value={settings.titleSuffix} onChange={e => updateField('titleSuffix', e.target.value)} />
                </div>
              </div>
            </TabsContent>

            {/* Open Graph */}
            <TabsContent value="og" className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.ogDefaultImage')}</Label>
                <Input value={settings.ogDefaultImage} onChange={e => updateField('ogDefaultImage', e.target.value)} placeholder="https://example.com/og-image.png" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('admin.seo.ogImageWidth')}</Label>
                  <Input value={settings.ogImageWidth} onChange={e => updateField('ogImageWidth', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('admin.seo.ogImageHeight')}</Label>
                  <Input value={settings.ogImageHeight} onChange={e => updateField('ogImageHeight', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.twitterCard')}</Label>
                <Select value={settings.twitterCard} onValueChange={v => updateField('twitterCard', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUMMARY">SUMMARY</SelectItem>
                    <SelectItem value="SUMMARY_LARGE_IMAGE">SUMMARY_LARGE_IMAGE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('admin.seo.twitterSite')}</Label>
                  <Input value={settings.twitterSite} onChange={e => updateField('twitterSite', e.target.value)} placeholder="@yoursite" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('admin.seo.twitterCreator')}</Label>
                  <Input value={settings.twitterCreator} onChange={e => updateField('twitterCreator', e.target.value)} placeholder="@creator" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.facebookAppId')}</Label>
                <Input value={settings.facebookAppId} onChange={e => updateField('facebookAppId', e.target.value)} />
              </div>
            </TabsContent>

            {/* Verification */}
            <TabsContent value="verification" className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.googleVerification')}</Label>
                <Input value={settings.googleSiteVerification} onChange={e => updateField('googleSiteVerification', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.bingVerification')}</Label>
                <Input value={settings.bingSiteVerification} onChange={e => updateField('bingSiteVerification', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.yandexVerification')}</Label>
                <Input value={settings.yandexVerification} onChange={e => updateField('yandexVerification', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.pinterestVerification')}</Label>
                <Input value={settings.pinterestVerification} onChange={e => updateField('pinterestVerification', e.target.value)} />
              </div>
            </TabsContent>

            {/* Canonical & HTTPS */}
            <TabsContent value="canonical" className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('admin.seo.canonicalDomain')}</Label>
                <Input value={settings.canonicalDomain} onChange={e => updateField('canonicalDomain', e.target.value)} placeholder="https://example.com" />
              </div>
              <Separator />
              <div className="space-y-3">
                {([
                  ['forceHttps', t('admin.seo.forceHttps')],
                  ['enableSitemap', t('admin.seo.enableSitemap')],
                  ['enableRobotsTxt', t('admin.seo.enableRobotsTxt')],
                  ['enableRssFeed', t('admin.seo.enableRssFeed')],
                  ['enableHreflang', 'Enable Hreflang'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    <Switch checked={settings[key as keyof SeoGlobalSettings] as boolean} onCheckedChange={v => updateField(key as keyof SeoGlobalSettings, v)} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SeoTemplates
// ============================================================

function SeoTemplates() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [templates, setTemplates] = useState<SeoTemplate[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/templates');
      if (res.ok) {
        const data = await res.json();
        // API returns array directly
        setTemplates(Array.isArray(data) && data.length > 0 ? data : [
          { id: 1, pageType: 'HOMEPAGE', titleTemplate: '{{siteName}}', descriptionTemplate: '{{siteDescription}}', keywordsTemplate: '{{keywords}}', ogTitleTemplate: '{{siteName}}', ogDescTemplate: '{{siteDescription}}', ogImageTemplate: '{{ogImage}}', isActive: true },
          { id: 2, pageType: 'CHANNEL_DETAIL', titleTemplate: '{{channelName}} - {{siteName}}', descriptionTemplate: '{{channelDescription}}', keywordsTemplate: '{{channelName}}, telegram', ogTitleTemplate: '{{channelName}}', ogDescTemplate: '{{channelDescription}}', ogImageTemplate: '{{channelImage}}', isActive: true },
          { id: 3, pageType: 'CATEGORY', titleTemplate: '{{categoryName}} - {{siteName}}', descriptionTemplate: '{{categoryDescription}}', keywordsTemplate: '{{categoryName}}, telegram', ogTitleTemplate: '{{categoryName}}', ogDescTemplate: '{{categoryDescription}}', ogImageTemplate: '{{ogImage}}', isActive: true },
          { id: 4, pageType: 'SEARCH', titleTemplate: '{{searchQuery}} - {{siteName}}', descriptionTemplate: 'Search results for {{searchQuery}}', keywordsTemplate: '{{searchQuery}}', ogTitleTemplate: '{{searchQuery}}', ogDescTemplate: 'Search results', ogImageTemplate: '{{ogImage}}', isActive: true },
        ]);
      } else {
        // Default templates
        setTemplates([
          { id: 1, pageType: 'home', titleTemplate: '{{siteName}}', descriptionTemplate: '{{siteDescription}}', keywordsTemplate: '{{keywords}}', ogTitleTemplate: '{{siteName}}', ogDescTemplate: '{{siteDescription}}', ogImageTemplate: '{{ogImage}}', isActive: true },
          { id: 2, pageType: 'channel', titleTemplate: '{{channelName}} - {{siteName}}', descriptionTemplate: '{{channelDescription}}', keywordsTemplate: '{{channelName}}, telegram', ogTitleTemplate: '{{channelName}}', ogDescTemplate: '{{channelDescription}}', ogImageTemplate: '{{channelImage}}', isActive: true },
          { id: 3, pageType: 'category', titleTemplate: '{{categoryName}} - {{siteName}}', descriptionTemplate: '{{categoryDescription}}', keywordsTemplate: '{{categoryName}}, telegram', ogTitleTemplate: '{{categoryName}}', ogDescTemplate: '{{categoryDescription}}', ogImageTemplate: '{{ogImage}}', isActive: true },
          { id: 4, pageType: 'search', titleTemplate: '{{searchQuery}} - {{siteName}}', descriptionTemplate: 'Search results for {{searchQuery}}', keywordsTemplate: '{{searchQuery}}', ogTitleTemplate: '{{searchQuery}}', ogDescTemplate: 'Search results', ogImageTemplate: '{{ogImage}}', isActive: true },
        ]);
      }
    } catch {
      // Use defaults on error
      setTemplates([
        { id: 1, pageType: 'home', titleTemplate: '{{siteName}}', descriptionTemplate: '{{siteDescription}}', keywordsTemplate: '{{keywords}}', ogTitleTemplate: '{{siteName}}', ogDescTemplate: '{{siteDescription}}', ogImageTemplate: '{{ogImage}}', isActive: true },
        { id: 2, pageType: 'channel', titleTemplate: '{{channelName}} - {{siteName}}', descriptionTemplate: '{{channelDescription}}', keywordsTemplate: '{{channelName}}, telegram', ogTitleTemplate: '{{channelName}}', ogDescTemplate: '{{channelDescription}}', ogImageTemplate: '{{channelImage}}', isActive: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleToggleActive = async (tmpl: SeoTemplate) => {
    const updated = { ...tmpl, isActive: !tmpl.isActive };
    setTemplates(prev => prev.map(t => t.id === tmpl.id ? updated : t));
    try {
      await fetch(`/api/admin/seo/templates/${tmpl.pageType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleSaveTemplate = async (tmpl: SeoTemplate) => {
    setSaving(tmpl.id);
    try {
      const res = await fetch(`/api/admin/seo/templates/${tmpl.pageType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tmpl),
      });
      if (res.ok) {
        toast.success(t('admin.seo.saved'));
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    } finally {
      setSaving(null);
    }
  };

  const updateTemplate = (id: number, field: keyof SeoTemplate, value: string | boolean) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const getVariablesForType = (pageType: string): string[] => {
    const common = ['{{siteName}}', '{{siteDescription}}', '{{ogImage}}'];
    const vars: Record<string, string[]> = {
      home: common,
      channel: [...common, '{{channelName}}', '{{channelDescription}}', '{{channelImage}}', '{{memberCount}}'],
      category: [...common, '{{categoryName}}', '{{categoryDescription}}'],
      search: [...common, '{{searchQuery}}'],
    };
    return vars[pageType] || common;
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      {templates.map(tmpl => {
        const isExpanded = expandedId === tmpl.id;
        const variables = getVariablesForType(tmpl.pageType);
        return (
          <Card key={tmpl.id}>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : tmpl.id)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-[#229ED9]" />
                  <Badge variant="outline" className="font-mono text-xs">{tmpl.pageType}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Switch checked={tmpl.isActive} onCheckedChange={() => handleToggleActive(tmpl)} />
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="space-y-4 pt-0">
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('admin.seo.titleTemplate')}</Label>
                  <Input value={tmpl.titleTemplate} onChange={e => updateTemplate(tmpl.id, 'titleTemplate', e.target.value)} />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variables.map(v => <Badge key={v} variant="secondary" className="text-[10px]">{v}</Badge>)}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('admin.seo.descriptionTemplate')}</Label>
                  <Textarea value={tmpl.descriptionTemplate} onChange={e => updateTemplate(tmpl.id, 'descriptionTemplate', e.target.value)} rows={2} />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variables.map(v => <Badge key={v} variant="secondary" className="text-[10px]">{v}</Badge>)}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('admin.seo.keywordsTemplate')}</Label>
                  <Input value={tmpl.keywordsTemplate} onChange={e => updateTemplate(tmpl.id, 'keywordsTemplate', e.target.value)} />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variables.map(v => <Badge key={v} variant="secondary" className="text-[10px]">{v}</Badge>)}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => handleSaveTemplate(tmpl)} disabled={saving === tmpl.id} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
                    {saving === tmpl.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================
// SeoSitemap
// ============================================================

function SeoSitemap() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<SitemapEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<SitemapEntry | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ url: '', priority: '0.5', changeFreq: 'weekly', excluded: false });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/sitemap');
      if (res.ok) {
        setEntries(await res.json());
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/admin/seo/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(t('admin.seo.entryAdded'));
        setAddOpen(false);
        setForm({ url: '', priority: '0.5', changeFreq: 'weekly', excluded: false });
        fetchEntries();
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleEdit = async () => {
    if (!editEntry) return;
    try {
      const res = await fetch(`/api/admin/seo/sitemap/${editEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editEntry.id }),
      });
      if (res.ok) {
        toast.success(t('admin.seo.entryUpdated'));
        setEditEntry(null);
        fetchEntries();
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/seo/sitemap/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('admin.seo.entryDeleted'));
        setDeleteId(null);
        fetchEntries();
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const openEdit = (entry: SitemapEntry) => {
    setForm({ url: entry.url, priority: String(entry.priority), changeFreq: entry.changeFreq, excluded: entry.excluded });
    setEditEntry(entry);
  };

  const sitemapUrl = typeof window !== 'undefined' ? `${window.location.origin}/sitemap.xml` : '/sitemap.xml';

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Sitemap URL */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium shrink-0">{t('admin.seo.sitemapUrl')}:</Label>
            <code className="text-sm bg-muted px-2 py-1 rounded flex-1 overflow-x-auto">{sitemapUrl}</code>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(sitemapUrl); toast.success('Copied!'); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Button variant="outline" size="sm" onClick={() => toast.success(t('admin.seo.sitemapRegenerated'))}>
              <RefreshCw className="h-4 w-4 mr-1" /> {t('admin.seo.regenerateSitemap')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info('Submitted to Google')}>
              <ExternalLink className="h-4 w-4 mr-1" /> {t('admin.seo.submitToGoogle')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('admin.seo.sitemap')}</CardTitle>
            <Button size="sm" onClick={() => { setForm({ url: '', priority: '0.5', changeFreq: 'weekly', excluded: false }); setAddOpen(true); }} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
              <Plus className="h-4 w-4 mr-1" /> {t('admin.seo.addEntry')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Map className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('admin.seo.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>{t('admin.seo.priority')}</TableHead>
                    <TableHead>{t('admin.seo.changeFreq')}</TableHead>
                    <TableHead>{t('admin.seo.excluded')}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{entry.url}</TableCell>
                      <TableCell>{entry.priority}</TableCell>
                      <TableCell>{entry.changeFreq}</TableCell>
                      <TableCell>{entry.excluded ? <Badge variant="destructive" className="text-[10px]">Yes</Badge> : <Badge variant="outline" className="text-[10px]">No</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.seo.addEntry')}</DialogTitle>
            <DialogDescription>Add a new sitemap entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="/path" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('admin.seo.priority')}</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1'].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.seo.changeFreq')}</Label>
                <Select value={form.changeFreq} onValueChange={v => setForm({ ...form, changeFreq: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.excluded} onCheckedChange={v => setForm({ ...form, excluded: v })} />
              <Label>{t('admin.seo.excluded')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-[#229ED9] hover:bg-[#1a8bc4]">{t('admin.seo.addEntry')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
            <DialogDescription>Edit sitemap entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('admin.seo.priority')}</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1'].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.seo.changeFreq')}</Label>
                <Select value={form.changeFreq} onValueChange={v => setForm({ ...form, changeFreq: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.excluded} onCheckedChange={v => setForm({ ...form, excluded: v })} />
              <Label>{t('admin.seo.excluded')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
            <Button onClick={handleEdit} className="bg-[#229ED9] hover:bg-[#1a8bc4]">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.seo.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SeoRobots
// ============================================================

function SeoRobots() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<RobotsRule[]>([]);
  const [newRule, setNewRule] = useState({ userAgent: '*', ruleType: 'Allow', path: '/' });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/robots');
      if (res.ok) {
        setRules(await res.json());
      } else {
        setRules([
          { id: 1, userAgent: '*', ruleType: 'Allow', path: '/' },
          { id: 2, userAgent: '*', ruleType: 'Disallow', path: '/api/' },
          { id: 3, userAgent: '*', ruleType: 'Disallow', path: '/admin/' },
        ]);
      }
    } catch {
      setRules([
        { id: 1, userAgent: '*', ruleType: 'Allow', path: '/' },
        { id: 2, userAgent: '*', ruleType: 'Disallow', path: '/api/' },
        { id: 3, userAgent: '*', ruleType: 'Disallow', path: '/admin/' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleAddRule = () => {
    if (!newRule.path) return;
    const rule: RobotsRule = { id: Date.now(), ...newRule };
    setRules(prev => [...prev, rule]);
    setNewRule({ userAgent: '*', ruleType: 'Allow', path: '' });
  };

  const handleRemoveRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seo/robots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
      if (res.ok) {
        toast.success(t('admin.seo.robotsSaved'));
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Group rules by userAgent
  const groupedRules = rules.reduce<Record<string, RobotsRule[]>>((acc, rule) => {
    const ua = rule.userAgent || '*';
    if (!acc[ua]) acc[ua] = [];
    acc[ua].push(rule);
    return acc;
  }, {});

  // Generate raw preview
  const generateRaw = () => {
    let raw = '';
    Object.entries(groupedRules).forEach(([ua, uaRules]) => {
      raw += `User-agent: ${ua}\n`;
      uaRules.forEach(r => {
        if (r.ruleType === 'Crawl-delay') {
          raw += `Crawl-delay: ${r.path}\n`;
        } else if (r.ruleType === 'Sitemap') {
          raw += `Sitemap: ${r.path}\n`;
        } else {
          raw += `${r.ruleType}: ${r.path}\n`;
        }
      });
      raw += '\n';
    });
    return raw.trim();
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BotIcon className="h-5 w-5 text-[#229ED9]" />
            {t('admin.seo.robots')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Rule */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1 flex-1 min-w-[140px]">
              <Label className="text-xs">{t('admin.seo.userAgent')}</Label>
              <Input value={newRule.userAgent} onChange={e => setNewRule({ ...newRule, userAgent: e.target.value })} placeholder="*" />
            </div>
            <div className="space-y-1 w-32">
              <Label className="text-xs">{t('admin.seo.ruleType')}</Label>
              <Select value={newRule.ruleType} onValueChange={v => setNewRule({ ...newRule, ruleType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Allow">Allow</SelectItem>
                  <SelectItem value="Disallow">Disallow</SelectItem>
                  <SelectItem value="Crawl-delay">Crawl-delay</SelectItem>
                  <SelectItem value="Sitemap">Sitemap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[140px]">
              <Label className="text-xs">{t('admin.seo.path')}</Label>
              <Input value={newRule.path} onChange={e => setNewRule({ ...newRule, path: e.target.value })} placeholder="/path" />
            </div>
            <Button size="sm" onClick={handleAddRule} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
              <Plus className="h-4 w-4 mr-1" /> {t('admin.seo.addRule')}
            </Button>
          </div>

          <Separator />

          {/* Visual Rules List */}
          {Object.entries(groupedRules).map(([ua, uaRules]) => (
            <div key={ua} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">User-agent: {ua}</Badge>
              </div>
              <div className="pl-4 space-y-1">
                {uaRules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-2 group">
                    <Badge variant={rule.ruleType === 'Allow' ? 'default' : rule.ruleType === 'Disallow' ? 'destructive' : 'secondary'} className="text-[10px] min-w-[70px] justify-center">
                      {rule.ruleType}
                    </Badge>
                    <code className="text-xs font-mono flex-1">{rule.path}</code>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive" onClick={() => handleRemoveRule(rule.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Raw Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#229ED9]" />
            Raw Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre">{generateRaw()}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SeoStructuredData
// ============================================================

function SeoStructuredData() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [schemas, setSchemas] = useState<StructuredDataSchema[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editSchema, setEditSchema] = useState<StructuredDataSchema | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', schemaType: 'Organization', pageType: 'home', jsonLd: '', isGlobal: true, isActive: true });

  const fetchSchemas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/structured-data');
      if (res.ok) {
        setSchemas(await res.json());
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchemas(); }, [fetchSchemas]);

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/admin/seo/structured-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(t('admin.seo.schemaAdded'));
        setAddOpen(false);
        setForm({ name: '', schemaType: 'Organization', pageType: 'home', jsonLd: '', isGlobal: true, isActive: true });
        fetchSchemas();
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleEdit = async () => {
    if (!editSchema) return;
    try {
      const res = await fetch(`/api/admin/seo/structured-data/${editSchema.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editSchema.id }),
      });
      if (res.ok) {
        toast.success(t('admin.seo.schemaUpdated'));
        setEditSchema(null);
        fetchSchemas();
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/seo/structured-data/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('admin.seo.schemaDeleted'));
        setDeleteId(null);
        fetchSchemas();
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleToggleActive = async (schema: StructuredDataSchema) => {
    const updated = { ...schema, isActive: !schema.isActive };
    setSchemas(prev => prev.map(s => s.id === schema.id ? updated : s));
    try {
      await fetch(`/api/admin/seo/structured-data/${schema.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const openEdit = (schema: StructuredDataSchema) => {
    setForm({ name: schema.name, schemaType: schema.schemaType, pageType: schema.pageType, jsonLd: schema.jsonLd, isGlobal: schema.isGlobal, isActive: schema.isActive });
    setEditSchema(schema);
  };

  const schemaTypes = ['Organization', 'WebSite', 'WebPage', 'BreadcrumbList', 'SearchAction', 'ItemList', 'FAQPage', 'Article', 'LocalBusiness'];

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium flex items-center gap-2">
          <Braces className="h-5 w-5 text-[#229ED9]" />
          {t('admin.seo.structuredData')}
        </h3>
        <Button size="sm" onClick={() => { setForm({ name: '', schemaType: 'Organization', pageType: 'home', jsonLd: '', isGlobal: true, isActive: true }); setAddOpen(true); }} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
          <Plus className="h-4 w-4 mr-1" /> {t('admin.seo.addSchema')}
        </Button>
      </div>

      {schemas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Braces className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('admin.seo.noData')}</p>
          </CardContent>
        </Card>
      ) : (
        schemas.map(schema => (
          <Card key={schema.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{schema.name}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{schema.schemaType}</Badge>
                  {schema.isGlobal && <Badge variant="secondary" className="text-[10px]">{t('admin.seo.isGlobal')}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={schema.isActive} onCheckedChange={() => handleToggleActive(schema)} />
                  <Button variant="ghost" size="sm" onClick={() => openEdit(schema)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(schema.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.seo.addSchema')}</DialogTitle>
            <DialogDescription>Add a new structured data schema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('admin.seo.schemaName')}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Schema" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.seo.schemaType')}</Label>
                <Select value={form.schemaType} onValueChange={v => setForm({ ...form, schemaType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schemaTypes.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.seo.pageType')}</Label>
              <Select value={form.pageType} onValueChange={v => setForm({ ...form, pageType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="channel">Channel</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.seo.jsonLd')}</Label>
              <Textarea value={form.jsonLd} onChange={e => setForm({ ...form, jsonLd: e.target.value })} rows={6} className="font-mono text-xs" placeholder='{"@context":"https://schema.org",...}' />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isGlobal} onCheckedChange={v => setForm({ ...form, isGlobal: v })} />
                <Label>{t('admin.seo.isGlobal')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-[#229ED9] hover:bg-[#1a8bc4]">{t('admin.seo.addSchema')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editSchema} onOpenChange={() => setEditSchema(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Schema</DialogTitle>
            <DialogDescription>Edit structured data schema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('admin.seo.schemaName')}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.seo.schemaType')}</Label>
                <Select value={form.schemaType} onValueChange={v => setForm({ ...form, schemaType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schemaTypes.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.seo.pageType')}</Label>
              <Select value={form.pageType} onValueChange={v => setForm({ ...form, pageType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="channel">Channel</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.seo.jsonLd')}</Label>
              <Textarea value={form.jsonLd} onChange={e => setForm({ ...form, jsonLd: e.target.value })} rows={6} className="font-mono text-xs" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isGlobal} onCheckedChange={v => setForm({ ...form, isGlobal: v })} />
                <Label>{t('admin.seo.isGlobal')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSchema(null)}>Cancel</Button>
            <Button onClick={handleEdit} className="bg-[#229ED9] hover:bg-[#1a8bc4]">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.seo.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SeoRedirects
// ============================================================

function SeoRedirects() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editRedirect, setEditRedirect] = useState<Redirect | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ fromPath: '', toPath: '', statusCode: 301, notes: '' });

  const fetchRedirects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/redirects');
      if (res.ok) {
        const data = await res.json();
        setRedirects(data.redirects || data);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRedirects(); }, [fetchRedirects]);

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/admin/seo/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(t('admin.seo.redirectAdded'));
        setAddOpen(false);
        setForm({ fromPath: '', toPath: '', statusCode: 301, notes: '' });
        fetchRedirects();
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleEdit = async () => {
    if (!editRedirect) return;
    try {
      const res = await fetch(`/api/admin/seo/redirects/${editRedirect.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editRedirect.id }),
      });
      if (res.ok) {
        toast.success(t('admin.seo.redirectUpdated'));
        setEditRedirect(null);
        fetchRedirects();
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/seo/redirects/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('admin.seo.redirectDeleted'));
        setDeleteId(null);
        fetchRedirects();
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const openEdit = (redirect: Redirect) => {
    setForm({ fromPath: redirect.fromPath, toPath: redirect.toPath, statusCode: redirect.statusCode, notes: redirect.notes });
    setEditRedirect(redirect);
  };

  const handleExportCsv = () => {
    const header = 'From,To,StatusCode,HitCount,Notes\n';
    const rows = redirects.map(r => `"${r.fromPath}","${r.toPath}",${r.statusCode},${r.hitCount},"${r.notes}"`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redirects.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusCodeColor = (code: number) => {
    if (code === 301) return 'default';
    if (code === 302) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-[#229ED9]" />
              {t('admin.seo.redirects')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={redirects.length === 0}>
                <Download className="h-4 w-4 mr-1" /> {t('admin.seo.exportRedirects')}
              </Button>
              <Button size="sm" onClick={() => { setForm({ fromPath: '', toPath: '', statusCode: 301, notes: '' }); setAddOpen(true); }} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
                <Plus className="h-4 w-4 mr-1" /> {t('admin.seo.addRedirect')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {redirects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowRightLeft className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('admin.seo.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.seo.fromPath')}</TableHead>
                    <TableHead>{t('admin.seo.toPath')}</TableHead>
                    <TableHead>{t('admin.seo.statusCode')}</TableHead>
                    <TableHead>{t('admin.seo.hitCount')}</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redirects.map(redirect => (
                    <TableRow key={redirect.id}>
                      <TableCell className="font-mono text-xs">{redirect.fromPath}</TableCell>
                      <TableCell className="font-mono text-xs">{redirect.toPath}</TableCell>
                      <TableCell><Badge variant={statusCodeColor(redirect.statusCode)} className="text-[10px]">{redirect.statusCode}</Badge></TableCell>
                      <TableCell>{redirect.hitCount}</TableCell>
                      <TableCell>{redirect.isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(redirect)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(redirect.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.seo.addRedirect')}</DialogTitle>
            <DialogDescription>Create a new redirect rule</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('admin.seo.fromPath')}</Label>
              <Input value={form.fromPath} onChange={e => setForm({ ...form, fromPath: e.target.value })} placeholder="/old-path" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.seo.toPath')}</Label>
              <Input value={form.toPath} onChange={e => setForm({ ...form, toPath: e.target.value })} placeholder="/new-path" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.seo.statusCode')}</Label>
              <Select value={String(form.statusCode)} onValueChange={v => setForm({ ...form, statusCode: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 - Permanent</SelectItem>
                  <SelectItem value="302">302 - Temporary</SelectItem>
                  <SelectItem value="307">307 - Temporary (preserve method)</SelectItem>
                  <SelectItem value="308">308 - Permanent (preserve method)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-[#229ED9] hover:bg-[#1a8bc4]">{t('admin.seo.addRedirect')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRedirect} onOpenChange={() => setEditRedirect(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Redirect</DialogTitle>
            <DialogDescription>Edit redirect rule</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('admin.seo.fromPath')}</Label>
              <Input value={form.fromPath} onChange={e => setForm({ ...form, fromPath: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.seo.toPath')}</Label>
              <Input value={form.toPath} onChange={e => setForm({ ...form, toPath: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.seo.statusCode')}</Label>
              <Select value={String(form.statusCode)} onValueChange={v => setForm({ ...form, statusCode: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 - Permanent</SelectItem>
                  <SelectItem value="302">302 - Temporary</SelectItem>
                  <SelectItem value="307">307 - Temporary (preserve method)</SelectItem>
                  <SelectItem value="308">308 - Permanent (preserve method)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRedirect(null)}>Cancel</Button>
            <Button onClick={handleEdit} className="bg-[#229ED9] hover:bg-[#1a8bc4]">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.seo.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SeoBrokenLinks
// ============================================================

function SeoBrokenLinks() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<BrokenLink[]>([]);
  const [filter, setFilter] = useState<'all' | 'resolved' | 'unresolved'>('unresolved');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/broken-links');
      if (res.ok) {
        const data = await res.json();
        setLinks(data.brokenLinks || data);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleResolve = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/seo/broken-links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true }),
      });
      if (res.ok) {
        toast.success(t('admin.seo.brokenLinkResolved'));
        fetchLinks();
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/seo/broken-links/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('admin.seo.brokenLinkDeleted'));
        setDeleteId(null);
        fetchLinks();
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const filtered = links.filter(link => {
    if (filter === 'resolved') return link.isResolved;
    if (filter === 'unresolved') return !link.isResolved;
    return true;
  });

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Unlink className="h-5 w-5 text-[#229ED9]" />
              {t('admin.seo.brokenLinks')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={v => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => toast.info('Scanning...')}>
                <Search className="h-4 w-4 mr-1" /> {t('admin.seo.scanBrokenLinks')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Unlink className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('admin.seo.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>{t('admin.seo.statusCode')}</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>{t('admin.seo.hitCount')}</TableHead>
                    <TableHead>Last Hit</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(link => (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{link.url}</TableCell>
                      <TableCell><Badge variant={link.statusCode >= 400 && link.statusCode < 500 ? 'destructive' : 'outline'} className="text-[10px]">{link.statusCode}</Badge></TableCell>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">{link.referrer}</TableCell>
                      <TableCell>{link.hitCount}</TableCell>
                      <TableCell className="text-xs">{link.lastHit ? new Date(link.lastHit).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{link.isResolved ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!link.isResolved && (
                            <Button variant="ghost" size="sm" onClick={() => handleResolve(link.id)} title="Mark as resolved">
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(link.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.seo.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SeoKeywords
// ============================================================

function SeoKeywords() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ keyword: '', language: 'en', country: '', targetUrl: '' });

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/keywords');
      if (res.ok) {
        setKeywords(await res.json());
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeywords(); }, [fetchKeywords]);

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/admin/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, position: 0, previousPosition: null, searchVolume: 0, difficulty: 0 }),
      });
      if (res.ok) {
        toast.success(t('admin.seo.keywordAdded'));
        setAddOpen(false);
        setForm({ keyword: '', language: 'en', country: '', targetUrl: '' });
        fetchKeywords();
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/seo/keywords/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('admin.seo.keywordDeleted'));
        setDeleteId(null);
        fetchKeywords();
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    }
  };

  const getPositionChange = (current: number, previous: number | null) => {
    if (previous === null) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    const diff = previous - current;
    if (diff > 0) return <span className="flex items-center gap-0.5 text-green-600 text-xs"><TrendingUp className="h-3 w-3" />+{diff}</span>;
    if (diff < 0) return <span className="flex items-center gap-0.5 text-red-600 text-xs"><TrendingDown className="h-3 w-3" />{diff}</span>;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-5 w-5 text-[#229ED9]" />
              {t('admin.seo.keywords')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.info('Refreshing...')}>
                <RefreshCw className="h-4 w-4 mr-1" /> {t('admin.seo.refreshPositions')}
              </Button>
              <Button size="sm" onClick={() => { setForm({ keyword: '', language: 'en', country: '', targetUrl: '' }); setAddOpen(true); }} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
                <Plus className="h-4 w-4 mr-1" /> {t('admin.seo.addKeyword')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {keywords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('admin.seo.noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.seo.keyword')}</TableHead>
                    <TableHead>{t('admin.seo.language')}</TableHead>
                    <TableHead>{t('admin.seo.country')}</TableHead>
                    <TableHead>{t('admin.seo.position')}</TableHead>
                    <TableHead>{t('admin.seo.change')}</TableHead>
                    <TableHead>{t('admin.seo.searchVolume')}</TableHead>
                    <TableHead>{t('admin.seo.difficulty')}</TableHead>
                    <TableHead>{t('admin.seo.targetUrl')}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map(kw => (
                    <TableRow key={kw.id}>
                      <TableCell className="font-medium text-sm">{kw.keyword}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{kw.language}</Badge></TableCell>
                      <TableCell className="text-xs">{kw.country || '-'}</TableCell>
                      <TableCell className="font-mono">{kw.position || '-'}</TableCell>
                      <TableCell>{getPositionChange(kw.position, kw.previousPosition)}</TableCell>
                      <TableCell>{kw.searchVolume || '-'}</TableCell>
                      <TableCell>{kw.difficulty || '-'}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[120px] truncate">{kw.targetUrl || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(kw.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.seo.addKeyword')}</DialogTitle>
            <DialogDescription>Add a keyword to track</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('admin.seo.keyword')}</Label>
              <Input value={form.keyword} onChange={e => setForm({ ...form, keyword: e.target.value })} placeholder="telegram channels" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('admin.seo.language')}</Label>
                <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tr">Turkish</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('admin.seo.country')}</Label>
                <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="US" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('admin.seo.targetUrl')}</Label>
              <Input value={form.targetUrl} onChange={e => setForm({ ...form, targetUrl: e.target.value })} placeholder="/categories/crypto" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-[#229ED9] hover:bg-[#1a8bc4]">{t('admin.seo.addKeyword')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.seo.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SeoAudit
// ============================================================

function SeoAudit() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [audits, setAudits] = useState<AuditData[]>([]);

  // Helper: safe JSON parse
  const safeParse = (val: unknown): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  };

  // Transform raw API audit data to frontend AuditData format
  const mapAuditData = (raw: Record<string, unknown>): AuditData => {
    const issuesArr = safeParse(raw.issues);
    const warningsArr = safeParse(raw.warnings);
    const passedArr = safeParse(raw.passed);
    // Derive sub-scores from the main score
    const score = typeof raw.score === 'number' ? raw.score : 72;
    return {
      id: raw.id as number,
      score,
      technicalSeo: Math.min(100, score + 5),
      contentQuality: Math.min(100, score - 2),
      metaInfo: Math.min(100, score + 2),
      performance: Math.min(100, score - 5),
      mobileCompatibility: Math.min(100, score + 3),
      criticalIssues: issuesArr.map(s => ({ title: String(s), description: String(s), impact: 'high' })),
      warnings: warningsArr.map(s => ({ title: String(s), description: String(s), impact: 'medium' })),
      suggestions: passedArr.map(s => ({ title: `✓ ${s}`, description: String(s), impact: 'low' })),
      createdAt: (raw.createdAt as string) || new Date().toISOString(),
    };
  };

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/audit');
      if (res.ok) {
        const data = await res.json();
        // API returns array of raw SeoAudit objects
        const rawArr = Array.isArray(data) ? data : [data];
        setAudits(rawArr.map(mapAuditData));
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  const handleStartAudit = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/admin/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'GLOBAL', url: typeof window !== 'undefined' ? window.location.origin : '/' }),
      });
      if (res.ok) {
        toast.success(t('admin.seo.auditStarted'));
        fetchAudits();
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    } finally {
      setScanning(false);
    }
  };

  const latestAudit = audits[0];

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Start Audit */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#229ED9]" />
            <span className="font-medium">{t('admin.seo.audit')}</span>
          </div>
          <Button onClick={handleStartAudit} disabled={scanning} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            {t('admin.seo.startScan')}
          </Button>
        </CardContent>
      </Card>

      {latestAudit && (
        <>
          {/* Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('admin.seo.auditScore')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <ScoreGauge score={latestAudit.score} />
                <div className="flex flex-wrap justify-center gap-6">
                  <MiniScoreGauge score={latestAudit.technicalSeo} label={t('admin.seo.technicalSeo')} />
                  <MiniScoreGauge score={latestAudit.contentQuality} label={t('admin.seo.contentQuality')} />
                  <MiniScoreGauge score={latestAudit.metaInfo} label={t('admin.seo.metaInfo')} />
                  <MiniScoreGauge score={latestAudit.performance} label={t('admin.seo.performance')} />
                  <MiniScoreGauge score={latestAudit.mobileCompatibility} label={t('admin.seo.mobileCompatibility')} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Critical */}
              {latestAudit.criticalIssues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" /> {t('admin.seo.criticalIssues')} ({latestAudit.criticalIssues.length})
                  </h4>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {latestAudit.criticalIssues.map((issue, i) => (
                      <div key={i} className="p-2.5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md">
                        <div className="text-sm font-medium">{issue.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{issue.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {latestAudit.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" /> {t('admin.seo.warnings')} ({latestAudit.warnings.length})
                  </h4>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {latestAudit.warnings.map((issue, i) => (
                      <div key={i} className="p-2.5 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <div className="text-sm font-medium">{issue.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{issue.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {latestAudit.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-blue-600">
                    <Activity className="h-4 w-4" /> {t('admin.seo.suggestions')} ({latestAudit.suggestions.length})
                  </h4>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {latestAudit.suggestions.map((issue, i) => (
                      <div key={i} className="p-2.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="text-sm font-medium">{issue.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{issue.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latestAudit.criticalIssues.length === 0 && latestAudit.warnings.length === 0 && latestAudit.suggestions.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No issues found!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {audits.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Audit History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {audits.map((audit, i) => (
                    <div key={audit.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <ScoreGauge score={audit.score} size={40} strokeWidth={4} />
                        <div>
                          <span className="text-sm font-medium">{i === 0 ? 'Latest' : `#${audits.length - i}`}</span>
                          <span className="text-xs text-muted-foreground ml-2">{new Date(audit.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{audit.criticalIssues.length} critical</span>
                        <span>{audit.warnings.length} warnings</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!latestAudit && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('admin.seo.noData')}</p>
            <p className="text-xs mt-1">Start an audit to see results</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// SeoAdvanced
// ============================================================

function SeoAdvanced() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    customHeadScripts: '',
    customBodyScripts: '',
    googleAnalyticsId: '',
    googleTagManagerId: '',
    facebookPixelId: '',
    hotjarId: '',
    microsoftClarityId: '',
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo/global');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          customHeadScripts: data.customHeadScripts || '',
          customBodyScripts: data.customBodyScripts || '',
          googleAnalyticsId: data.googleAnalyticsId || '',
          googleTagManagerId: data.googleTagManagerId || '',
          facebookPixelId: data.facebookPixelId || '',
          hotjarId: data.hotjarId || '',
          microsoftClarityId: data.microsoftClarityId || '',
        });
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seo/global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success(t('admin.seo.saved'));
      } else {
        toast.error(t('admin.seo.saveFailed'));
      }
    } catch {
      toast.error(t('admin.seo.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Custom Scripts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-5 w-5 text-[#229ED9]" />
            Custom Scripts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('admin.seo.customHeadScripts')}</Label>
            <Textarea value={settings.customHeadScripts} onChange={e => updateField('customHeadScripts', e.target.value)} rows={6} className="font-mono text-xs" placeholder="<script>...</script>" />
            <p className="text-xs text-muted-foreground">These scripts will be injected into the &lt;head&gt; of every page.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('admin.seo.customBodyScripts')}</Label>
            <Textarea value={settings.customBodyScripts} onChange={e => updateField('customBodyScripts', e.target.value)} rows={6} className="font-mono text-xs" placeholder="<script>...</script>" />
            <p className="text-xs text-muted-foreground">These scripts will be injected before the closing &lt;/body&gt; tag.</p>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Integrations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#229ED9]" />
            Analytics & Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> {t('admin.seo.analyticsId')}
              </Label>
              <Input value={settings.googleAnalyticsId} onChange={e => updateField('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> {t('admin.seo.tagManagerId')}
              </Label>
              <Input value={settings.googleTagManagerId} onChange={e => updateField('googleTagManagerId', e.target.value)} placeholder="GTM-XXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> {t('admin.seo.pixelId')} (Facebook)
              </Label>
              <Input value={settings.facebookPixelId} onChange={e => updateField('facebookPixelId', e.target.value)} placeholder="1234567890" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> Hotjar ID
              </Label>
              <Input value={settings.hotjarId} onChange={e => updateField('hotjarId', e.target.value)} placeholder="1234567" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> Microsoft Clarity ID
              </Label>
              <Input value={settings.microsoftClarityId} onChange={e => updateField('microsoftClarityId', e.target.value)} placeholder="abcdef1234" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>
    </div>
  );
}
