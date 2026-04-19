'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAppStore, type AdminTab } from '@/lib/store';
import { toast } from 'sonner';
import { formatMemberCount, parseI18nField, stringToColor, getInitials } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Tv,
  FileText,
  Layers,
  Users,
  Crown,
  Settings,
  Shield,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Ban,
  Eye,
  ChevronLeft,
  ChevronRight,
  Globe,
  MessageSquare,
  Link,
  DollarSign,
  TrendingUp,
  Clock,
  UserCog,
  Edit,
  Bot,
  Pin,
  Pencil,
  Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { invalidateSiteSettingsCache } from '@/lib/hooks/use-site-settings';

const TelegramPanel = dynamic(() => import('@/components/admin/telegram-panel'), { ssr: false });
const CommentsPanel = dynamic(() => import('@/components/admin/comments-panel'), { ssr: false });
const SeoPanel = dynamic(() => import('@/components/admin/seo-panel'), { ssr: false });

// ---- Types ----

interface AdminStats {
  totalChannels: number;
  totalGroups: number;
  totalMembers: number;
  registeredUsers: number;
  pendingSubmissions: number;
  activePremium: number;
}

interface AdminChannel {
  id: number;
  username: string;
  title: string;
  type: string;
  avatarUrl: string | null;
  description: string | null;
  memberCount: number;
  language: string;
  isPremium: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  rank: number | null;
  inviteLink: string | null;
  websiteUrl: string | null;
  categoryId: number | null;
  category: { id: number; name: string; slug: string } | null;
}

interface AdminSubmission {
  id: number;
  telegramUsername: string;
  title: string;
  type: string;
  language: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION';
  reviewNote: string | null;
  createdAt: string;
  userId: number;
  userName: string;
}

interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  channelCount: number;
  order: number;
  isActive: boolean;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  avatar: string | null;
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
}

interface PremiumPlan {
  id: number;
  name: string;
  duration: number;
  price: number;
  features: string;
  isActive: boolean;
}

// ---- Main Component ----

export function AdminView() {
  const { t } = useI18n();
  const { adminTab, setAdminTab, user } = useAppStore();

  const tabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: t('admin.dashboard'), icon: BarChart3 },
    { key: 'channels', label: t('admin.channels'), icon: Tv },
    { key: 'submissions', label: t('admin.submissions'), icon: FileText },
    { key: 'categories', label: t('admin.categories'), icon: Layers },
    { key: 'users', label: t('admin.users'), icon: Users },
    { key: 'premium', label: t('admin.premium'), icon: Crown },
    { key: 'settings', label: t('admin.settings'), icon: Settings },
    { key: 'telegram', label: 'Telegram API', icon: Bot },
    { key: 'comments', label: t('admin.comments'), icon: MessageSquare },
    { key: 'seo', label: t('admin.seo'), icon: Search },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="h-6 w-6 text-[#229ED9]" />
        {t('header.admin')}
      </h1>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation - Desktop */}
        <nav className="hidden md:block md:w-56 shrink-0">
          <div className="flex flex-col gap-1 sticky top-24">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAdminTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  adminTab === tab.key
                    ? 'text-[#229ED9] bg-[#229ED9]/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Horizontal Tabs - Mobile */}
        <nav className="md:hidden w-full">
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAdminTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  adminTab === tab.key
                    ? 'text-[#229ED9] bg-[#229ED9]/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {adminTab === 'dashboard' && <DashboardTab />}
          {adminTab === 'channels' && <ChannelsTab />}
          {adminTab === 'submissions' && <SubmissionsTab />}
          {adminTab === 'categories' && <CategoriesTab />}
          {adminTab === 'users' && <UsersTab />}
          {adminTab === 'premium' && <PremiumTab />}
          {adminTab === 'settings' && <SettingsTab />}
          {adminTab === 'telegram' && <TelegramPanel />}
          {adminTab === 'comments' && <CommentsPanel />}
          {adminTab === 'seo' && <SeoPanel />}
        </div>
      </div>
    </div>
  );
}

// ---- 1. Dashboard Tab ----

function DashboardTab() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const statCards = [
    { label: t('admin.totalChannels'), value: stats?.totalChannels ?? 0, icon: Tv, color: 'text-[#229ED9]', bg: 'bg-[#229ED9]/10' },
    { label: t('admin.totalGroups'), value: stats?.totalGroups ?? 0, icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: t('admin.totalMembers'), value: stats?.totalMembers ?? 0, icon: BarChart3, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: t('admin.registeredUsers'), value: stats?.registeredUsers ?? 0, icon: UserCog, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { label: t('admin.pendingSubmissions'), value: stats?.pendingSubmissions ?? 0, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: t('admin.activePremium'), value: stats?.activePremium ?? 0, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('admin.dashboard')}</h2>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RotateCcw className="h-4 w-4 mr-1" />
          {t('common.refresh')}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {typeof card.value === 'number' && card.value > 999
                      ? formatMemberCount(card.value, t)
                      : card.value}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <div className={`mt-2 h-1 w-12 rounded-full ${card.bg}`}>
                <div className={`h-1 w-8 rounded-full ${card.color.replace('text-', 'bg-')}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---- 2. Channels Tab ----

const CHANNEL_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'es', label: 'Español' },
  { value: 'ar', label: 'العربية' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
];

const CHANNEL_TYPES = [
  { value: 'CHANNEL', label: 'Channel' },
  { value: 'GROUP', label: 'Group' },
  { value: 'SUPERGROUP', label: 'Supergroup' },
];

interface ChannelForm {
  title: string;
  username: string;
  description: string;
  type: string;
  language: string;
  categoryId: string;
  inviteLink: string;
  websiteUrl: string;
  memberCount: number;
  isActive: boolean;
  isVerified: boolean;
  isPremium: boolean;
  isFeatured: boolean;
}

const defaultChannelForm: ChannelForm = {
  title: '',
  username: '',
  description: '',
  type: 'CHANNEL',
  language: 'en',
  categoryId: 'none',
  inviteLink: '',
  websiteUrl: '',
  memberCount: 0,
  isActive: true,
  isVerified: false,
  isPremium: false,
  isFeatured: false,
};

function ChannelsTab() {
  const { t } = useI18n();
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editChannel, setEditChannel] = useState<AdminChannel | null>(null);
  const [channelForm, setChannelForm] = useState<ChannelForm>(defaultChannelForm);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/channels?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(
          (data || []).map((c: Record<string, unknown>) => ({
            id: c.id as number,
            name: typeof c.name === 'string' ? c.name : JSON.stringify(c.name),
            slug: c.slug as string,
          }))
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const filtered = channels.filter((ch) =>
    !search ||
    ch.title.toLowerCase().includes(search.toLowerCase()) ||
    ch.username.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (ch: AdminChannel) => {
    setEditChannel(ch);
    setChannelForm({
      title: ch.title,
      username: ch.username,
      description: ch.description || '',
      type: ch.type,
      language: ch.language,
      categoryId: ch.categoryId ? String(ch.categoryId) : 'none',
      inviteLink: ch.inviteLink || '',
      websiteUrl: ch.websiteUrl || '',
      memberCount: ch.memberCount,
      isActive: ch.isActive,
      isVerified: ch.isVerified,
      isPremium: ch.isPremium,
      isFeatured: ch.isFeatured,
    });
  };

  const handleEditSave = async () => {
    if (!editChannel) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editChannel.id,
          title: channelForm.title,
          description: channelForm.description || null,
          type: channelForm.type,
          language: channelForm.language,
          categoryId: channelForm.categoryId && channelForm.categoryId !== 'none' ? parseInt(channelForm.categoryId) : null,
          inviteLink: channelForm.inviteLink || null,
          websiteUrl: channelForm.websiteUrl || null,
          memberCount: channelForm.memberCount,
          isActive: channelForm.isActive,
          isVerified: channelForm.isVerified,
          isPremium: channelForm.isPremium,
          isFeatured: channelForm.isFeatured,
        }),
      });
      if (res.ok) {
        toast.success(t('common.save') + '!');
        setEditChannel(null);
        fetchChannels();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (id: number, current: boolean) => {
    try {
      const res = await fetch('/api/admin/channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFeatured: !current }),
      });
      if (res.ok) {
        toast.success(!current ? t('admin.pinToTop') : t('admin.unpinFromTop'));
        fetchChannels();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleTogglePremium = async (id: number, current: boolean) => {
    try {
      const res = await fetch('/api/admin/channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPremium: !current }),
      });
      if (res.ok) {
        toast.success(!current ? 'Premium enabled' : 'Premium disabled');
        fetchChannels();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleToggleVerified = async (id: number, current: boolean) => {
    try {
      const res = await fetch('/api/admin/channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isVerified: !current }),
      });
      if (res.ok) {
        toast.success(!current ? 'Verified' : 'Unverified');
        fetchChannels();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/channels?id=${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Channel deleted');
        setDeleteId(null);
        fetchChannels();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const deleteChannel = channels.find((ch) => ch.id === deleteId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('admin.channelManagement')}</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search') + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>{t('home.table.name')}</TableHead>
                  <TableHead className="text-right">{t('home.table.members')}</TableHead>
                  <TableHead className="text-center">{t('home.table.language')}</TableHead>
                  <TableHead className="text-center">{t('channels.type')}</TableHead>
                  <TableHead className="text-center">{t('channels.featured')}</TableHead>
                  <TableHead className="text-center">{t('channels.premium')}</TableHead>
                  <TableHead className="text-center">{t('channels.verified')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ch, idx) => (
                  <TableRow key={ch.id} className={ch.isFeatured ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                    <TableCell className="font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                          style={{ backgroundColor: stringToColor(ch.username) }}
                        >
                          {getInitials(ch.title)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm truncate max-w-[200px]">{ch.title}</span>
                            {!ch.isActive && (
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1 py-0">
                                {t('common.inactive')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">@{ch.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMemberCount(ch.memberCount, t)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs border rounded px-1.5 py-0.5">{ch.language.toUpperCase()}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {ch.type === 'GROUP' ? t('channels.group') : ch.type === 'SUPERGROUP' ? t('channels.supergroup') : t('channels.channel')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleFeatured(ch.id, ch.isFeatured)}
                        className="focus:outline-none"
                        title={ch.isFeatured ? t('admin.unpinFromTop') : t('admin.pinToTop')}
                      >
                        <Pin className={`h-4 w-4 mx-auto transition-colors ${ch.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} />
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleTogglePremium(ch.id, ch.isPremium)}
                        className="focus:outline-none"
                      >
                        <Badge className={ch.isPremium ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-muted text-muted-foreground'}>
                          <Crown className="h-3 w-3 mr-1" />
                          {ch.isPremium ? 'PRO' : '—'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleVerified(ch.id, ch.isVerified)}
                        className="focus:outline-none"
                      >
                        {ch.isVerified ? (
                          <CheckCircle className="h-5 w-5 text-[#229ED9]" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 mx-auto" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(ch)}
                          title={t('admin.editChannel')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(ch.id)}
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
            {filtered.map((ch, idx) => (
              <Card key={ch.id} className={ch.isFeatured ? 'border-amber-300 dark:border-amber-700' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                      style={{ backgroundColor: stringToColor(ch.username) }}
                    >
                      {getInitials(ch.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm truncate">{ch.title}</span>
                        {ch.isFeatured && <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                        {ch.isVerified && <CheckCircle className="h-4 w-4 text-[#229ED9] shrink-0" />}
                        {ch.isPremium && (
                          <Badge className="bg-amber-500 text-white text-[10px] px-1 py-0">
                            <Crown className="h-2.5 w-2.5 mr-0.5" />PRO
                          </Badge>
                        )}
                        {!ch.isActive && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1 py-0">
                            {t('common.inactive')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">@{ch.username}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>#{idx + 1}</span>
                        <span>{formatMemberCount(ch.memberCount, t)}</span>
                        <span className="border rounded px-1">{ch.language.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleToggleFeatured(ch.id, ch.isFeatured)}
                        title={ch.isFeatured ? t('admin.unpinFromTop') : t('admin.pinToTop')}
                      >
                        <Pin className={`h-3.5 w-3.5 ${ch.isFeatured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(ch)}
                        title={t('admin.editChannel')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => setDeleteId(ch.id)}
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('common.filter')}: {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Channel Dialog */}
      <Dialog open={editChannel !== null} onOpenChange={(open) => { if (!open) setEditChannel(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.editChannel')}</DialogTitle>
            <DialogDescription>{t('admin.channelDetails')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ch-title">{t('dashboard.channelName')}</Label>
                <Input
                  id="ch-title"
                  value={channelForm.title}
                  onChange={(e) => setChannelForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-username">{t('auth.username')}</Label>
                <Input
                  id="ch-username"
                  value={channelForm.username}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ch-desc">{t('channels.description')}</Label>
              <Textarea
                id="ch-desc"
                value={channelForm.description}
                onChange={(e) => setChannelForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('channels.type')}</Label>
                <Select
                  value={channelForm.type}
                  onValueChange={(v) => setChannelForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNEL_TYPES.map((tp) => (
                      <SelectItem key={tp.value} value={tp.value}>{tp.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('home.table.language')}</Label>
                <Select
                  value={channelForm.language}
                  onValueChange={(v) => setChannelForm((f) => ({ ...f, language: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNEL_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('channels.category')}</Label>
                <Select
                  value={channelForm.categoryId}
                  onValueChange={(v) => setChannelForm((f) => ({ ...f, categoryId: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {parseI18nField(cat.name, 'en')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ch-invite">Invite Link</Label>
                <Input
                  id="ch-invite"
                  value={channelForm.inviteLink}
                  onChange={(e) => setChannelForm((f) => ({ ...f, inviteLink: e.target.value }))}
                  placeholder="https://t.me/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-website">Website URL</Label>
                <Input
                  id="ch-website"
                  value={channelForm.websiteUrl}
                  onChange={(e) => setChannelForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ch-members">{t('dashboard.memberCount')}</Label>
                <Input
                  id="ch-members"
                  type="number"
                  value={channelForm.memberCount}
                  onChange={(e) => setChannelForm((f) => ({ ...f, memberCount: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <Label htmlFor="ch-active" className="text-sm cursor-pointer">{t('channels.isActive')}</Label>
                <Switch
                  id="ch-active"
                  checked={channelForm.isActive}
                  onCheckedChange={(v) => setChannelForm((f) => ({ ...f, isActive: v }))}
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <Label htmlFor="ch-verified" className="text-sm cursor-pointer">{t('channels.verified')}</Label>
                <Switch
                  id="ch-verified"
                  checked={channelForm.isVerified}
                  onCheckedChange={(v) => setChannelForm((f) => ({ ...f, isVerified: v }))}
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <Label htmlFor="ch-premium" className="text-sm cursor-pointer">{t('channels.premium')}</Label>
                <Switch
                  id="ch-premium"
                  checked={channelForm.isPremium}
                  onCheckedChange={(v) => setChannelForm((f) => ({ ...f, isPremium: v }))}
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <Label htmlFor="ch-featured" className="text-sm cursor-pointer">{t('channels.featured')}</Label>
                <Switch
                  id="ch-featured"
                  checked={channelForm.isFeatured}
                  onCheckedChange={(v) => setChannelForm((f) => ({ ...f, isFeatured: v }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditChannel(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditSave} disabled={saving} className="bg-[#229ED9] hover:bg-[#1a8bc4]">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteChannel
                ? `This will permanently delete "${deleteChannel.title}" (@${deleteChannel.username}). This action cannot be undone.`
                : 'This action cannot be undone. This will permanently delete the channel.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- 3. Submissions Tab ----

function SubmissionsTab() {
  const { t } = useI18n();
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    id: number | null;
    action: 'APPROVED' | 'REJECTED' | 'REVISION';
    note: string;
  }>({ open: false, id: null, action: 'APPROVED', note: '' });

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const filtered = statusFilter === 'ALL'
    ? submissions
    : submissions.filter((s) => s.status === statusFilter);

  const handleReview = async () => {
    if (!reviewDialog.id) return;
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewDialog.id,
          status: reviewDialog.action,
          reviewNote: reviewDialog.note,
        }),
      });
      if (res.ok) {
        const actionLabel =
          reviewDialog.action === 'APPROVED'
            ? t('admin.approve')
            : reviewDialog.action === 'REJECTED'
            ? t('admin.reject')
            : t('admin.requestRevision');
        toast.success(`${actionLabel} - Success`);
        setReviewDialog({ open: false, id: null, action: 'APPROVED', note: '' });
        fetchSubmissions();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    REVISION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const statusLabels: Record<string, string> = {
    PENDING: t('dashboard.channelStatus.pending'),
    APPROVED: t('dashboard.channelStatus.approved'),
    REJECTED: t('dashboard.channelStatus.rejected'),
    REVISION: t('dashboard.channelStatus.revision'),
  };

  const filterButtons: { key: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'; label: string }[] = [
    { key: 'ALL', label: t('common.all') },
    { key: 'PENDING', label: t('dashboard.channelStatus.pending') },
    { key: 'APPROVED', label: t('dashboard.channelStatus.approved') },
    { key: 'REJECTED', label: t('dashboard.channelStatus.rejected') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('admin.submissions')}</h2>
        <div className="flex items-center gap-1 flex-wrap">
          {filterButtons.map((btn) => (
            <Button
              key={btn.key}
              variant={statusFilter === btn.key ? 'default' : 'outline'}
              size="sm"
              className={statusFilter === btn.key ? 'bg-[#229ED9] hover:bg-[#1a8bc4]' : ''}
              onClick={() => setStatusFilter(btn.key)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('common.noResults')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
          {filtered.map((sub) => (
            <Card key={sub.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{sub.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[sub.status]}`}>
                        {statusLabels[sub.status]}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 space-x-3">
                      <span>@{sub.telegramUsername}</span>
                      <span>{sub.type === 'GROUP' ? t('channels.group') : t('channels.channel')}</span>
                      <span>{sub.language.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('auth.name')}: {sub.userName} &middot; {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                    {sub.reviewNote && (
                      <div className="text-xs mt-1 text-muted-foreground bg-muted/50 rounded px-2 py-1">
                        {t('admin.reviewNote')}: {sub.reviewNote}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sub.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-8"
                          onClick={() =>
                            setReviewDialog({ open: true, id: sub.id, action: 'APPROVED', note: '' })
                          }
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          {t('admin.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8"
                          onClick={() =>
                            setReviewDialog({ open: true, id: sub.id, action: 'REJECTED', note: '' })
                          }
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          {t('admin.reject')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() =>
                            setReviewDialog({ open: true, id: sub.id, action: 'REVISION', note: '' })
                          }
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          {t('admin.requestRevision')}
                        </Button>
                      </>
                    )}
                    {sub.status !== 'PENDING' && (
                      <Button size="sm" variant="ghost" className="h-8">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {t('admin.submissionDetails')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">{page} / {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Review Note Dialog */}
      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) => setReviewDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === 'APPROVED'
                ? t('admin.approve')
                : reviewDialog.action === 'REJECTED'
                ? t('admin.reject')
                : t('admin.requestRevision')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.reviewNote')} ({t('common.more').toLowerCase()})
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('admin.reviewNote') + '...'}
            value={reviewDialog.note}
            onChange={(e) =>
              setReviewDialog((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialog({ open: false, id: null, action: 'APPROVED', note: '' })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className={
                reviewDialog.action === 'APPROVED'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : reviewDialog.action === 'REJECTED'
                  ? 'bg-destructive hover:bg-destructive/90 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }
              onClick={handleReview}
            >
              {reviewDialog.action === 'APPROVED'
                ? t('admin.approve')
                : reviewDialog.action === 'REJECTED'
                ? t('admin.reject')
                : t('admin.requestRevision')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- 4. Categories Tab ----

function CategoriesTab() {
  const { t, language } = useI18n();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<AdminCategory | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '', order: 0, isActive: true });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(
          (data || []).map((c: Record<string, unknown>) => ({
            id: c.id as number,
            name: c.name as string,
            slug: c.slug as string,
            icon: (c.icon as string) || null,
            channelCount: (c.channelCount as number) || 0,
            order: (c.order as number) || 0,
            isActive: c.isActive !== false,
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openAdd = () => {
    setForm({ name: '', slug: '', icon: '', order: categories.length + 1, isActive: true });
    setAddDialog(true);
  };

  const openEdit = (cat: AdminCategory) => {
    setForm({
      name: parseI18nField(cat.name, language),
      slug: cat.slug,
      icon: cat.icon || '',
      order: cat.order,
      isActive: cat.isActive,
    });
    setEditDialog(cat);
  };

  const handleSave = async () => {
    try {
      if (editDialog) {
        const res = await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editDialog.id,
            name: form.name,
            slug: form.slug,
            icon: form.icon,
            order: form.order,
            isActive: form.isActive,
          }),
        });
        if (res.ok) {
          await invalidateSiteSettingsCache();
          toast.success(t('common.save') + '!');
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || t('common.error'));
        }
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug,
            icon: form.icon,
            order: form.order,
            isActive: form.isActive,
          }),
        });
        if (res.ok) {
          await invalidateSiteSettingsCache();
          toast.success(t('admin.addNew') + '!');
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || t('common.error'));
        }
      }
    } catch {
      toast.error(t('common.error'));
    }
    setAddDialog(false);
    setEditDialog(null);
    fetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        await invalidateSiteSettingsCache();
        toast.success(t('common.delete') + '!');
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setDeleteId(null);
    fetchCategories();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('admin.categories')}</h2>
        <Button size="sm" className="bg-[#229ED9] hover:bg-[#1a8bc4]" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          {t('admin.addNew')}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Icon</TableHead>
                  <TableHead>{t('dashboard.channelName')}</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">{t('home.channelsCount')}</TableHead>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="text-center">{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <span className="text-xl">{cat.icon || '📁'}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {parseI18nField(cat.name, language)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                    <TableCell className="text-center">{cat.channelCount}</TableCell>
                    <TableCell className="text-center">{cat.order}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          cat.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }
                      >
                        {cat.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteId(cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {categories.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon || '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{parseI18nField(cat.name, language)}</div>
                      <div className="text-xs text-muted-foreground">{cat.slug}</div>
                    </div>
                    <Badge
                      className={
                        cat.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }
                    >
                      {cat.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(cat)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setDeleteId(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={addDialog || editDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialog(false);
            setEditDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog ? t('common.edit') : t('admin.addNew')} {t('admin.categories').toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('dashboard.channelName')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="category-slug"
              />
            </div>
            <div>
              <Label>Icon (emoji)</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="📁"
              />
            </div>
            <div>
              <Label>Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label>{t('common.active')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialog(false);
                setEditDialog(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button className="bg-[#229ED9] hover:bg-[#1a8bc4]" onClick={handleSave}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- 5. Users Tab ----

function UsersTab() {
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleBanUnban = async (id: number, currentStatus: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED',
        }),
      });
      if (res.ok) {
        toast.success(currentStatus === 'BANNED' ? t('admin.unban') : t('admin.ban'));
        fetchUsers();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleChangeRole = async (id: number, role: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      });
      if (res.ok) {
        toast.success('Role updated');
        fetchUsers();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/users?id=${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User deleted');
        setDeleteId(null);
        fetchUsers();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('admin.users')}</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search') + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-56"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('common.filter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('common.all')}</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="USER">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('auth.name')}</TableHead>
                  <TableHead>{t('auth.email')}</TableHead>
                  <TableHead>{t('auth.username')}</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">{t('common.status')}</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                          style={{ backgroundColor: stringToColor(u.name) }}
                        >
                          {getInitials(u.name)}
                        </div>
                        <span className="font-medium text-sm">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm">@{u.username}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(role) => handleChangeRole(u.id, role)}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="USER">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          u.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }
                      >
                        {u.status === 'ACTIVE' ? t('common.active') : 'Banned'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.status === 'BANNED' ? 'text-green-600' : 'text-orange-600'}
                          onClick={() => handleBanUnban(u.id, u.status)}
                        >
                          {u.status === 'BANNED' ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t('admin.unban')}
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4 mr-1" />
                              {t('admin.ban')}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteId(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {filtered.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                      style={{ backgroundColor: stringToColor(u.name) }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm">{u.name}</span>
                        <Badge
                          className={
                            u.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]'
                          }
                        >
                          {u.status === 'ACTIVE' ? t('common.active') : 'Banned'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">@{u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Select
                          value={u.role}
                          onValueChange={(role) => handleChangeRole(u.id, role)}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="USER">User</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.status === 'BANNED' ? 'text-green-600 h-7' : 'text-orange-600 h-7'}
                          onClick={() => handleBanUnban(u.id, u.status)}
                        >
                          {u.status === 'BANNED' ? t('admin.unban') : t('admin.ban')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-7 w-7 p-0"
                          onClick={() => setDeleteId(u.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">{page} / {totalPages}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- 6. Premium Tab ----

function PremiumTab() {
  const { t } = useI18n();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/premium/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t('admin.premium')}</h2>

      {/* Revenue Stats Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.monthlyRevenue')}</p>
                <p className="text-2xl font-bold mt-1">$0</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.orderManagement')}</p>
                <p className="text-2xl font-bold mt-1">0</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#229ED9]/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#229ED9]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.activePremium')}</p>
                <p className="text-2xl font-bold mt-1">0</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Plans */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">{t('admin.planManagement')}</CardTitle>
          <Button size="sm" className="bg-[#229ED9] hover:bg-[#1a8bc4]">
            <Plus className="h-4 w-4 mr-1" />
            {t('admin.addNew')}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Crown className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No premium plans configured</p>
            </div>
          ) : (
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.channelName')}</TableHead>
                    <TableHead>{t('premium.duration')}</TableHead>
                    <TableHead>{t('premium.price')}</TableHead>
                    <TableHead className="text-center">{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{plan.duration} days</TableCell>
                      <TableCell>${plan.price}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            plan.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }
                        >
                          {plan.isActive ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
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

      {/* Premium Orders Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.orderManagement')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No premium orders yet</p>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Report Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.revenueReport')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Revenue reports coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- 7. Settings Tab ----

function SettingsTab() {
  const { t } = useI18n();
  const [siteName, setSiteName] = useState('Telegram Directory');
  const [siteDescription, setSiteDescription] = useState('The most comprehensive Telegram channel and group directory');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialTelegram, setSocialTelegram] = useState('');
  const [socialDiscord, setSocialDiscord] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch settings from API on mount
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSiteName(data.siteName || 'Telegram Directory');
        setSiteDescription(data.siteDescription || '');
        setDefaultLanguage(data.defaultLanguage || 'en');
        setMaintenanceMode(data.maintenanceMode || false);
        setAdsEnabled(data.adsEnabled || false);
        setSocialTelegram(data.socialTelegram || '');
        setSocialTwitter(data.socialTwitter || '');
        setSocialDiscord(data.socialDiscord || '');
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName,
          siteDescription,
          defaultLanguage,
          maintenanceMode,
          adsEnabled,
          socialTelegram,
          socialTwitter,
          socialDiscord,
        }),
      });
      if (res.ok) {
        // Invalidate client-side cache so the site reflects changes immediately
        await invalidateSiteSettingsCache();
        toast.success(t('common.save') + '!');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 bg-muted animate-pulse rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('admin.generalSettings')}</h2>
        <Button variant="outline" size="sm" onClick={fetchSettings}>
          <RotateCcw className="h-4 w-4 mr-1" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.generalSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="site-name">Site Name</Label>
            <Input
              id="site-name"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="site-desc">Description</Label>
            <Textarea
              id="site-desc"
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Default Language</Label>
            <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="tr">Türkçe</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="id">Indonesia</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">When enabled, the site shows a maintenance page to non-admin users</p>
              </div>
            </div>
            <Badge className={maintenanceMode ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}>
              {maintenanceMode ? 'ON' : 'OFF'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch checked={adsEnabled} onCheckedChange={setAdsEnabled} />
              <div>
                <Label>Ads Enabled</Label>
                <p className="text-xs text-muted-foreground">Enable advertisement placements on the site</p>
              </div>
            </div>
            <Badge className={adsEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}>
              {adsEnabled ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.socialLinks')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#229ED9]" />
              Telegram
            </Label>
            <Input
              placeholder="https://t.me/..."
              value={socialTelegram}
              onChange={(e) => setSocialTelegram(e.target.value)}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Twitter / X
            </Label>
            <Input
              placeholder="https://x.com/..."
              value={socialTwitter}
              onChange={(e) => setSocialTwitter(e.target.value)}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Link className="h-4 w-4 text-violet-500" />
              Discord
            </Label>
            <Input
              placeholder="https://discord.gg/..."
              value={socialDiscord}
              onChange={(e) => setSocialDiscord(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save All Button */}
      <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm py-3 px-4 rounded-lg border">
        <p className="text-sm text-muted-foreground mr-auto">Changes are saved when you click the save button</p>
        <Button variant="outline" onClick={fetchSettings} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button className="bg-[#229ED9] hover:bg-[#1a8bc4]" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              {t('common.save')}...
            </>
          ) : (
            t('common.save')
          )}
        </Button>
      </div>

      {/* Payment Settings Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.paymentSettings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Payment settings will be available in a future update</p>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Settings Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.moderationSettings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Moderation settings will be available in a future update</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
