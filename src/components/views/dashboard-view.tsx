'use client';

import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { formatMemberCount, parseI18nField } from '@/lib/helpers';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import {
  Plus, Trash2, Pencil, Crown, Shield, User, Key, AlertTriangle,
  Tv, ChevronRight, Check, X, Clock, Eye, Package,
} from 'lucide-react';

// ==================== Types ====================

interface UserChannel {
  id: number;
  username: string;
  title: string;
  description: string | null;
  type: string;
  memberCount: number;
  language: string;
  status: string;
  isPremium: boolean;
  isVerified: boolean;
  category: { id: number; name: string; slug: string } | null;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

interface PremiumPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  durationDays: number;
  price: number;
  currency: string;
  features: string | null;
  isActive: boolean;
  order: number;
}

// ==================== Main Component ====================

export default function DashboardView() {
  const { t } = useI18n();
  const { user, dashboardTab, setDashboardTab } = useAppStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t('auth.login')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>

      <Tabs value={dashboardTab} onValueChange={(v) => setDashboardTab(v as 'channels' | 'add-channel' | 'premium' | 'settings')} className="space-y-6">
        <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="channels" className="gap-1.5 text-xs sm:text-sm">
            <Tv className="size-4" />
            {t('dashboard.myChannels')}
          </TabsTrigger>
          <TabsTrigger value="add-channel" className="gap-1.5 text-xs sm:text-sm">
            <Plus className="size-4" />
            {t('dashboard.addChannel')}
          </TabsTrigger>
          <TabsTrigger value="premium" className="gap-1.5 text-xs sm:text-sm">
            <Crown className="size-4" />
            {t('dashboard.premium')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="size-4" />
            {t('dashboard.settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <MyChannelsTab />
        </TabsContent>

        <TabsContent value="add-channel">
          <AddChannelTab />
        </TabsContent>

        <TabsContent value="premium">
          <PremiumTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== My Channels Tab ====================

function MyChannelsTab() {
  const { t } = useI18n();
  const { user, setDashboardTab } = useAppStore();
  const [channels, setChannels] = useState<UserChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/channels?userId=${user.id}`);
      const data = await res.json();
      setChannels(data.channels || data || []);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleDelete = async (channelId: number) => {
    try {
      const res = await fetch(`/api/channels/${channelId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('common.delete'));
        fetchChannels();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'secondary',
      APPROVED: 'default',
      REJECTED: 'destructive',
      REVISION_REQUESTED: 'outline',
    };
    const labels: Record<string, string> = {
      PENDING: t('dashboard.channelStatus.pending'),
      APPROVED: t('dashboard.channelStatus.approved'),
      REJECTED: t('dashboard.channelStatus.rejected'),
      REVISION_REQUESTED: t('dashboard.channelStatus.revision'),
    };
    return (
      <Badge variant={variants[status] || 'secondary'} className="text-xs">
        {status === 'PENDING' && <Clock className="size-3 mr-1" />}
        {status === 'APPROVED' && <Check className="size-3 mr-1" />}
        {status === 'REJECTED' && <X className="size-3 mr-1" />}
        {status === 'REVISION_REQUESTED' && <Eye className="size-3 mr-1" />}
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Tv className="size-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">{t('dashboard.noChannels')}</p>
            <Button onClick={() => setDashboardTab('add-channel')} className="gap-2">
              <Plus className="size-4" />
              {t('dashboard.addFirst')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.myChannels')}</CardTitle>
        <CardDescription>
          {channels.length} {t('home.channelsCount')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.channelName')}</TableHead>
                <TableHead>{t('channels.type')}</TableHead>
                <TableHead>{t('dashboard.memberCount')}</TableHead>
                <TableHead>{t('home.table.language')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                        {channel.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">{channel.title}</span>
                          {channel.isVerified && <span className="text-[#229ED9] text-sm">✓</span>}
                          {channel.isPremium && <Crown className="size-3.5 text-amber-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground">@{channel.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {channel.type === 'CHANNEL' ? t('channels.channel') : t('channels.group')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm">{formatMemberCount(channel.memberCount, t)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium border rounded px-1.5 py-0.5">{channel.language.toUpperCase()}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(channel.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={t('dashboard.editChannel')}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" title={t('dashboard.deleteChannel')}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('dashboard.deleteChannel')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {channel.title}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(channel.id)} className="bg-destructive text-white hover:bg-destructive/90">
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {channels.map((channel) => (
            <div key={channel.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                    {channel.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{channel.title}</span>
                      {channel.isVerified && <span className="text-[#229ED9] text-sm">✓</span>}
                      {channel.isPremium && <Crown className="size-3.5 text-amber-500" />}
                    </div>
                    <div className="text-xs text-muted-foreground">@{channel.username}</div>
                  </div>
                </div>
                {getStatusBadge(channel.status)}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="text-xs">
                  {channel.type === 'CHANNEL' ? t('channels.channel') : t('channels.group')}
                </Badge>
                <span className="font-medium">{formatMemberCount(channel.memberCount, t)}</span>
                <span className="text-xs font-medium border rounded px-1.5 py-0.5">{channel.language.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-end gap-1 pt-1 border-t">
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                  <Pencil className="size-3" />
                  {t('common.edit')}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-destructive hover:text-destructive">
                      <Trash2 className="size-3" />
                      {t('common.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('dashboard.deleteChannel')}</AlertDialogTitle>
                      <AlertDialogDescription>{channel.title}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(channel.id)} className="bg-destructive text-white hover:bg-destructive/90">
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Add Channel Tab ====================

function AddChannelTab() {
  const { t } = useI18n();
  const { user, setDashboardTab } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    telegramUsername: '',
    title: '',
    description: '',
    type: 'CHANNEL',
    language: 'en',
    categoryId: '',
    inviteLink: '',
  });

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.telegramUsername.trim()) {
      toast.error(t('auth.username'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        userId: user?.id,
        telegramUsername: form.telegramUsername.replace(/^@/, ''),
      };

      const res = await fetch('/api/dashboard/submit-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(t('common.submit'));
        setForm({
          telegramUsername: '',
          title: '',
          description: '',
          type: 'CHANNEL',
          language: 'en',
          categoryId: '',
          inviteLink: '',
        });
        setDashboardTab('channels');
      } else {
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.addChannel')}</CardTitle>
        <CardDescription>
          {t('dashboard.addFirst')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Telegram Username */}
          <div className="space-y-2">
            <Label htmlFor="telegramUsername">
              {t('auth.username')} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                id="telegramUsername"
                placeholder="channel_username"
                value={form.telegramUsername}
                onChange={(e) => updateForm('telegramUsername', e.target.value)}
                className="pl-8"
                required
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('dashboard.channelName')}</Label>
            <Input
              id="title"
              placeholder={t('dashboard.channelName')}
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('channels.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('channels.description')}
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Type & Language Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('channels.type')}</Label>
              <Select value={form.type} onValueChange={(v) => updateForm('type', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHANNEL">{t('channels.channel')}</SelectItem>
                  <SelectItem value="GROUP">{t('channels.group')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('home.table.language')}</Label>
              <Select value={form.language} onValueChange={(v) => updateForm('language', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tr">Turkce</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="id">Indonesian</SelectItem>
                  <SelectItem value="vi">Vietnamese</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category & Invite Link Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('channels.category')}</Label>
              <Select value={form.categoryId} onValueChange={(v) => updateForm('categoryId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('channels.category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {parseCatName(cat.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteLink">Invite Link</Label>
              <Input
                id="inviteLink"
                placeholder="https://t.me/..."
                value={form.inviteLink}
                onChange={(e) => updateForm('inviteLink', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDashboardTab('channels')}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('common.submit')}
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {t('common.submit')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ==================== Premium Tab ====================

function PremiumTab() {
  const { t, language } = useI18n();
  const { user } = useAppStore();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [premiumChannels, setPremiumChannels] = useState<UserChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [plansRes, channelsRes] = await Promise.all([
          fetch('/api/premium/plans'),
          user ? fetch(`/api/dashboard/channels?userId=${user.id}`) : Promise.resolve(null),
        ]);

        const plansData = await plansRes.json();
        setPlans(Array.isArray(plansData) ? plansData : []);

        if (channelsRes) {
          const channelsData = await channelsRes.json();
          const allChannels: UserChannel[] = channelsData.channels || channelsData || [];
          setPremiumChannels(allChannels.filter((ch: UserChannel) => ch.isPremium));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-5 text-amber-500" />
            {t('dashboard.activeSubscriptions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {premiumChannels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Crown className="size-10 mx-auto mb-3 opacity-30" />
              <p>{t('premium.activeSubscriptions')}: 0</p>
            </div>
          ) : (
            <div className="space-y-3">
              {premiumChannels.map((ch) => (
                <div key={ch.id} className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                  <div className="flex items-center gap-3">
                    <Crown className="size-5 text-amber-500" />
                    <div>
                      <div className="font-medium">{ch.title}</div>
                      <div className="text-xs text-muted-foreground">@{ch.username}</div>
                    </div>
                  </div>
                  <Badge className="bg-amber-500">{t('channels.premium')}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Plans */}
      <Card>
        <CardHeader>
          <CardTitle>{t('premium.selectPlan')}</CardTitle>
          <CardDescription>{t('premium.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.length > 0 ? plans.map((plan) => {
              const features = parseFeatures(plan.features);
              // Map feature keys to i18n translation keys
              const featureKeyMap: Record<string, string> = {
                listingPosition: 'premium.topPosition',
                featuredBadge: 'premium.featuredBadge',
                highlightColor: 'premium.highlightColor',
                bannerSlot: 'premium.sponsoredBanner',
                priorityInCategory: 'premium.categoryPriority',
                detailedStats: 'premium.detailedStats',
                maxChannels: 'premium.maxChannels',
              };
              // Build a list of displayable feature items
              const featureItems: Array<{ label: string; included: boolean; detail?: string }> = [];
              if (plan.features && typeof features === 'object') {
                for (const [key, value] of Object.entries(features)) {
                  const i18nKey = featureKeyMap[key];
                  if (!i18nKey) continue; // skip unknown keys
                  if (value === null || value === undefined) {
                    // null/undefined means not included
                    featureItems.push({ label: t(i18nKey), included: false });
                  } else if (typeof value === 'boolean') {
                    featureItems.push({ label: t(i18nKey), included: value });
                  } else if (key === 'maxChannels' && typeof value === 'number') {
                    featureItems.push({ label: t(i18nKey), included: true, detail: String(value) });
                  } else if (typeof value === 'string' && value !== 'null') {
                    // String values like "top" mean the feature is included
                    featureItems.push({ label: t(i18nKey), included: true });
                  }
                }
              }
              return (
                <div key={plan.id} className={`relative rounded-xl border p-6 flex flex-col ${plan.slug === 'gold' ? 'border-2 border-amber-500 shadow-lg' : ''}`}>
                  {plan.slug === 'gold' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Popular
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-center">{parseI18nField(plan.name, language) || plan.slug}</h3>
                  <div className="text-center mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.durationDays}d</span>
                  </div>
                  <Separator className="my-4" />
                  <ul className="space-y-2 text-sm flex-1">
                    {featureItems.length > 0 ? featureItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {item.included ? (
                          <Check className="size-3.5 text-green-500 shrink-0" />
                        ) : (
                          <X className="size-3.5 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={!item.included ? 'text-muted-foreground/60' : ''}>
                          {item.label}{item.detail ? `: ${item.detail}` : ''}
                        </span>
                      </li>
                    )) : (
                      <>
                        <li className="flex items-center gap-2"><Check className="size-3.5 text-green-500 shrink-0" />{t('premium.topPosition')}</li>
                        <li className="flex items-center gap-2"><Check className="size-3.5 text-green-500 shrink-0" />{t('premium.featuredBadge')}</li>
                      </>
                    )}
                  </ul>
                  <Button
                    className={`mt-4 w-full ${plan.slug === 'gold' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                    variant={plan.slug === 'gold' ? 'default' : 'outline'}
                  >
                    {t('premium.buyNow')}
                  </Button>
                </div>
              );
            }) : (
              /* Default plans when API returns empty */
              [
                { name: t('premium.bronze'), price: '$9.99', days: 7, slug: 'bronze' },
                { name: t('premium.silver'), price: '$29.99', days: 30, slug: 'silver' },
                { name: t('premium.gold'), price: '$74.99', days: 90, slug: 'gold' },
                { name: t('premium.platinum'), price: '$249.99', days: 365, slug: 'platinum' },
              ].map((plan) => (
                <div key={plan.slug} className={`relative rounded-xl border p-6 flex flex-col ${plan.slug === 'gold' ? 'border-2 border-amber-500 shadow-lg' : ''}`}>
                  {plan.slug === 'gold' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Popular
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-center">{plan.name}</h3>
                  <div className="text-center mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.days}d</span>
                  </div>
                  <Separator className="my-4" />
                  <ul className="space-y-2 text-sm flex-1">
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-green-500 shrink-0" />{t('premium.topPosition')}</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-green-500 shrink-0" />{t('premium.featuredBadge')}</li>
                    {plan.slug !== 'bronze' && <li className="flex items-center gap-2"><Check className="size-3.5 text-green-500 shrink-0" />{t('premium.highlightColor')}</li>}
                    {plan.slug === 'gold' || plan.slug === 'platinum' ? <li className="flex items-center gap-2"><Check className="size-3.5 text-green-500 shrink-0" />{t('premium.detailedStats')}</li> : null}
                    {plan.slug === 'platinum' && <li className="flex items-center gap-2"><Check className="size-3.5 text-green-500 shrink-0" />{t('premium.sponsoredBanner')}</li>}
                  </ul>
                  <Button
                    className={`mt-4 w-full ${plan.slug === 'gold' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                    variant={plan.slug === 'gold' ? 'default' : 'outline'}
                  >
                    {t('premium.buyNow')}
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('premium.subtitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('channels.category')}</TableHead>
                  <TableHead className="text-center">{t('premium.bronze')}</TableHead>
                  <TableHead className="text-center">{t('premium.silver')}</TableHead>
                  <TableHead className="text-center bg-amber-50/50 dark:bg-amber-950/20">{t('premium.gold')}</TableHead>
                  <TableHead className="text-center">{t('premium.platinum')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { feature: t('premium.topPosition'), bronze: '7d', silver: '30d', gold: '90d', platinum: '365d' },
                  { feature: t('premium.featuredBadge'), bronze: true, silver: true, gold: true, platinum: true },
                  { feature: t('premium.highlightColor'), bronze: false, silver: true, gold: true, platinum: true },
                  { feature: t('premium.categoryPriority'), bronze: false, silver: false, gold: true, platinum: true },
                  { feature: t('premium.detailedStats'), bronze: false, silver: false, gold: true, platinum: true },
                  { feature: t('premium.sponsoredBanner'), bronze: false, silver: false, gold: false, platinum: true },
                ].map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    {(['bronze', 'silver', 'gold', 'platinum'] as const).map((plan) => (
                      <TableCell key={plan} className={`text-center ${plan === 'gold' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                        {typeof row[plan] === 'boolean' ? (
                          row[plan] ? <Check className="size-4 text-green-500 mx-auto" /> : <X className="size-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-sm">{String(row[plan])}</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order History Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            {t('dashboard.orderHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="size-10 mx-auto mb-3 opacity-30" />
            <p>{t('premium.orderHistory')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Settings Tab ====================

function SettingsTab() {
  const { t } = useI18n();
  const { user, setUser } = useAppStore();

  // Profile form state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    bio: '',
    telegramUsername: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account confirmation
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user && setUser) {
          setUser(data.user);
        }
        toast.success(t('common.save'));
      } else {
        const data = await res.json();
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.newPass.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPass,
        }),
      });
      if (res.ok) {
        toast.success(t('dashboard.changePassword'));
        setPasswords({ current: '', newPass: '', confirm: '' });
      } else {
        const data = await res.json();
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) return;
    try {
      const res = await fetch('/api/auth/me', { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('dashboard.deleteAccount'));
        if (setUser) setUser(null);
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            {t('dashboard.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">{t('auth.name')}</Label>
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">{t('auth.email')}</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-username">{t('auth.username')}</Label>
                <Input
                  id="profile-username"
                  value={profile.username}
                  onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-telegram">Telegram {t('auth.username')}</Label>
                <Input
                  id="profile-telegram"
                  placeholder="@username"
                  value={profile.telegramUsername}
                  onChange={(e) => setProfile((p) => ({ ...p, telegramUsername: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                placeholder="Tell us about yourself..."
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile} className="gap-2">
                {savingProfile ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {t('common.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="size-5" />
            {t('dashboard.changePassword')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t('auth.password')}</Label>
              <Input
                id="current-password"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('auth.password')}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingPassword} className="gap-2">
                {savingPassword ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {t('dashboard.changePassword')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            {t('dashboard.deleteAccount')}
          </CardTitle>
          <CardDescription>
            This action cannot be undone. All your data will be permanently deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <strong>{user?.username}</strong> to confirm
              </Label>
              <Input
                id="delete-confirm"
                placeholder={user?.username}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deleteConfirm !== user?.username}
                  className="gap-2"
                >
                  <AlertTriangle className="size-4" />
                  {t('dashboard.deleteAccount')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('dashboard.deleteAccount')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All your channels, submissions, and account data will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-white hover:bg-destructive/90">
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Utility Functions ====================

function parseCatName(nameStr: string): string {
  try {
    const parsed = JSON.parse(nameStr);
    if (parsed && typeof parsed === 'object') return parsed.en || parsed[Object.keys(parsed)[0]] || nameStr;
    return nameStr;
  } catch {
    return nameStr;
  }
}

function parseFeatures(jsonStr: string | null | undefined): Record<string, unknown> {
  if (!jsonStr) return {};
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return {};
  }
}
