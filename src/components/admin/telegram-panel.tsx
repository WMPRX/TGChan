'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Bot, Settings, Play, CheckCircle, XCircle, Clock, Loader2,
  Plus, Trash2, RefreshCw, AlertCircle, Zap, Eye, EyeOff,
  Globe2, Database, Search,
} from 'lucide-react';

// ============ TYPES ============

interface FetchStatus {
  success: boolean;
  totalChannels: number;
  channelsFetched: number;
  channelsFailed: number;
  errors: string[];
  duration: number;
}

interface TelegramSettings {
  botToken: string;
  botTokenSet: boolean;
  apiId: string;
  apiHash: string;
  apiHashSet: boolean;
  fetchInterval: number;
  autoFetch: boolean;
  lastFetchAt: string | null;
  lastFetchStatus: FetchStatus | null;
  channelUsernames: string[];
}

interface BotValidation {
  valid: boolean;
  botInfo?: { id: number; username: string; firstName: string };
  error?: string;
}

interface DiscoveredChannel {
  chatId: number;
  username?: string;
  title?: string;
  type: string;
}

// ============ MAIN COMPONENT ============

export default function TelegramPanel() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchAlling, setFetchAlling] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showApiHash, setShowApiHash] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [discoveredChannels, setDiscoveredChannels] = useState<DiscoveredChannel[]>([]);

  const [settings, setSettings] = useState<TelegramSettings>({
    botToken: '',
    botTokenSet: false,
    apiId: '',
    apiHash: '',
    apiHashSet: false,
    fetchInterval: 60,
    autoFetch: false,
    lastFetchAt: null,
    lastFetchStatus: null,
    channelUsernames: [],
  });

  const [botValidation, setBotValidation] = useState<BotValidation | null>(null);

  // Fetch interval options (use i18n)
  const FETCH_INTERVALS = [
    { value: 30, label: t('admin.telegram.30min') },
    { value: 60, label: t('admin.telegram.1hour') },
    { value: 180, label: t('admin.telegram.3hours') },
    { value: 1440, label: t('admin.telegram.24hours') },
  ];

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/telegram');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      toast.error(t('admin.telegram.settingsLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/telegram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: settings.botToken,
          apiId: settings.apiId,
          apiHash: settings.apiHash,
          fetchInterval: settings.fetchInterval,
          autoFetch: settings.autoFetch,
          channelUsernames: settings.channelUsernames,
        }),
      });
      if (res.ok) {
        toast.success(t('admin.telegram.settingsSaved'));
        fetchSettings();
        setBotValidation(null);
      } else {
        toast.error(t('admin.telegram.settingsSaveFailed'));
      }
    } catch {
      toast.error(t('admin.telegram.connectionError'));
    } finally {
      setSaving(false);
    }
  };

  // Validate bot token
  const handleValidate = async () => {
    setValidating(true);
    try {
      const tokenToSend = settings.botToken.includes('***') ? undefined : settings.botToken;
      if (!tokenToSend) {
        toast.error(t('admin.telegram.enterTokenFirst'));
        setValidating(false);
        return;
      }
      const res = await fetch('/api/admin/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', botToken: tokenToSend }),
      });
      const data = await res.json();
      setBotValidation(data);
      if (data.valid) {
        toast.success(`${t('admin.telegram.validated')}: @${data.botInfo.username}`);
      } else {
        toast.error(`${t('admin.telegram.validationFailed')}: ${data.error}`);
      }
    } catch {
      toast.error(t('admin.telegram.connectionError'));
    } finally {
      setValidating(false);
    }
  };

  // Manual fetch (monitored channels only)
  const handleFetch = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/admin/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.channelsFetched} ${t('admin.telegram.channelsUpdated')}`);
      } else {
        toast.error(`${t('admin.telegram.fetchFailed')}: ${data.errors?.join(', ') || ''}`);
      }
      fetchSettings();
    } catch {
      toast.error(t('admin.telegram.connectionError'));
    } finally {
      setFetching(false);
    }
  };

  // Fetch ALL channels from database
  const handleFetchAll = async () => {
    setFetchAlling(true);
    try {
      const res = await fetch('/api/admin/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetchAll' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${t('admin.telegram.allChannelsUpdated')}: ${data.channelsFetched} ${t('admin.telegram.successful')}, ${data.channelsFailed} ${t('admin.telegram.failed')}`);
      } else {
        toast.error(`${t('admin.telegram.fetchFailed')}: ${data.errors?.join(', ') || ''}`);
      }
      fetchSettings();
    } catch {
      toast.error(t('admin.telegram.connectionError'));
    } finally {
      setFetchAlling(false);
    }
  };

  // Discover bot channels
  const handleDiscover = async () => {
    setDiscovering(true);
    setDiscoveredChannels([]);
    try {
      const res = await fetch('/api/admin/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discover' }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscoveredChannels(data.discovered || []);
        if (data.addedToMonitor > 0) {
          toast.success(`${data.discovered.length} ${t('admin.telegram.discoveredAdded')}`);
          fetchSettings();
        } else if (data.discovered.length > 0) {
          toast.info(`${data.discovered.length} ${t('admin.telegram.discoveredAllExist')}`);
        } else {
          toast.info(t('admin.telegram.noDiscovered'));
        }
      } else {
        toast.error(`${t('admin.telegram.discoverFailed')}: ${data.errors?.join(', ') || ''}`);
      }
    } catch {
      toast.error(t('admin.telegram.connectionError'));
    } finally {
      setDiscovering(false);
    }
  };

  // Add channel username (auto-saves to API)
  const handleAddUsername = async () => {
    const trimmed = newUsername.trim().replace(/^@/, '').toLowerCase();
    if (!trimmed) return;
    if (settings.channelUsernames.includes(trimmed)) {
      toast.error(t('admin.telegram.channelAlreadyExists'));
      return;
    }
    const updatedUsernames = [...settings.channelUsernames, trimmed];
    setSettings({
      ...settings,
      channelUsernames: updatedUsernames,
    });
    setNewUsername('');
    try {
      await fetch('/api/admin/telegram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUsernames: updatedUsernames }),
      });
    } catch {
      // Silently fail
    }
  };

  // Remove channel username (auto-saves to API)
  const handleRemoveUsername = async (username: string) => {
    const updatedUsernames = settings.channelUsernames.filter(u => u !== username);
    setSettings({
      ...settings,
      channelUsernames: updatedUsernames,
    });
    try {
      await fetch('/api/admin/telegram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUsernames: updatedUsernames }),
      });
    } catch {
      // Silently fail
    }
  };

  const isAnyFetching = fetching || fetchAlling;

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* API Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-emerald-500" />
              {t('admin.telegram.botConfig')}
            </CardTitle>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Settings className="h-4 w-4 mr-1" />}
              {t('admin.telegram.saveSettings')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bot Token */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('admin.telegram.botToken')}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={settings.botToken}
                  onChange={e => setSettings({ ...settings, botToken: e.target.value })}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleValidate}
                disabled={validating}
                className="shrink-0"
              >
                {validating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                {t('admin.telegram.validate')}
              </Button>
            </div>
            {botValidation && (
              <div className={`flex items-center gap-2 text-xs mt-1 ${botValidation.valid ? 'text-green-600' : 'text-red-500'}`}>
                {botValidation.valid ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Bot: @{botValidation.botInfo?.username} ({botValidation.botInfo?.firstName})</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    <span>{botValidation.error}</span>
                  </>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t('admin.telegram.botTokenPlaceholder')}
            </p>
          </div>

          <Separator />

          {/* API ID & Hash */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('admin.telegram.apiId')}</Label>
              <Input
                value={settings.apiId}
                onChange={e => setSettings({ ...settings, apiId: e.target.value })}
                placeholder="12345678"
              />
              <p className="text-xs text-muted-foreground">{t('admin.telegram.apiIdDesc')}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('admin.telegram.apiHash')}</Label>
              <div className="relative">
                <Input
                  type={showApiHash ? 'text' : 'password'}
                  value={settings.apiHash}
                  onChange={e => setSettings({ ...settings, apiHash: e.target.value })}
                  placeholder="abc123def456..."
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowApiHash(!showApiHash)}
                >
                  {showApiHash ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Fetch Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-emerald-500" />
            {t('admin.telegram.fetchActions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action buttons grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Fetch Monitored */}
            <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">{t('admin.telegram.fetchMonitored')}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t('admin.telegram.fetchMonitoredDesc')}
              </p>
              <Button
                onClick={handleFetch}
                disabled={isAnyFetching || !settings.botTokenSet || settings.channelUsernames.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                {fetching ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> {t('admin.telegram.fetching')}</>
                ) : (
                  <><Play className="h-4 w-4 mr-1" /> {t('admin.telegram.fetchNow')} ({settings.channelUsernames.length})</>
                )}
              </Button>
            </div>

            {/* Fetch ALL */}
            <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Globe2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{t('admin.telegram.fetchAll')}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t('admin.telegram.fetchAllDesc')}
              </p>
              <Button
                onClick={handleFetchAll}
                disabled={isAnyFetching || !settings.botTokenSet}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {fetchAlling ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> {t('admin.telegram.fetching')}</>
                ) : (
                  <><Globe2 className="h-4 w-4 mr-1" /> {t('admin.telegram.fetchAll')}</>
                )}
              </Button>
            </div>

            {/* Discover Channels */}
            <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">{t('admin.telegram.discover')}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t('admin.telegram.discoverDesc')}
              </p>
              <Button
                onClick={handleDiscover}
                disabled={discovering || !settings.botTokenSet}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                {discovering ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> {t('admin.telegram.scanning')}</>
                ) : (
                  <><Search className="h-4 w-4 mr-1" /> {t('admin.telegram.discover')}</>
                )}
              </Button>
            </div>
          </div>

          {!settings.botTokenSet && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t('admin.telegram.configBotFirst')}
              </p>
            </div>
          )}

          {/* Discovered Channels Result */}
          {discoveredChannels.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">{t('admin.telegram.discoveredChannels')} ({discoveredChannels.length})</span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {discoveredChannels.map((ch) => (
                  <div
                    key={ch.chatId}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                        style={{ backgroundColor: stringToColor(ch.username || String(ch.chatId)) }}
                      >
                        {(ch.title || ch.username || '???').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium truncate block max-w-[200px]">
                          {ch.title || t('admin.telegram.unnamed')}
                        </span>
                        {ch.username ? (
                          <span className="text-xs text-muted-foreground">@{ch.username}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">ID: {ch.chatId}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {ch.type === 'channel' ? t('admin.telegram.channel') : ch.type === 'supergroup' ? t('admin.telegram.supergroup') : t('admin.telegram.group')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fetch Settings */}
          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('admin.telegram.fetchInterval')}</Label>
              <Select
                value={String(settings.fetchInterval)}
                onValueChange={v => setSettings({ ...settings, fetchInterval: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FETCH_INTERVALS.map(fi => (
                    <SelectItem key={fi.value} value={String(fi.value)}>{fi.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('admin.telegram.fetchMonitoredDesc')}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={settings.autoFetch}
                  onCheckedChange={v => setSettings({ ...settings, autoFetch: v })}
                />
                <Label className="text-sm">{t('admin.telegram.autoFetch')}</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('admin.telegram.autoFetch')}
              </p>
            </div>
          </div>

          {/* Cron URL Info */}
          {settings.autoFetch && settings.botTokenSet && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">{t('admin.telegram.cronUrl')}</p>
              <p className="text-xs text-muted-foreground mb-2">
                {t('admin.telegram.cronDesc')}
              </p>
              <code className="text-[11px] bg-white dark:bg-gray-900 px-2 py-1 rounded border block overflow-x-auto">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/cron/telegram-fetch?secret=telegram-cron-secret-2024` : '/api/cron/telegram-fetch?secret=telegram-cron-secret-2024'}
              </code>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t('admin.telegram.recommendedCron')}: {FETCH_INTERVALS.find(f => f.value === settings.fetchInterval)?.label || t('admin.telegram.1hour')}
              </p>
            </div>
          )}

          {/* Last Fetch Status */}
          {settings.lastFetchAt && (
            <div className="space-y-2">
              <Separator />
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {t('admin.telegram.lastFetchTime')}: {new Date(settings.lastFetchAt).toLocaleString()}
                </span>
              </div>
              {settings.lastFetchStatus && (
                <div className={`p-3 rounded-lg text-xs space-y-1 ${
                  settings.lastFetchStatus.success
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2 font-medium">
                    {settings.lastFetchStatus.success ? (
                      <><CheckCircle className="h-3.5 w-3.5 text-green-600" /> {t('admin.telegram.successful')}</>
                    ) : (
                      <><XCircle className="h-3.5 w-3.5 text-red-500" /> {t('admin.telegram.failed')}</>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    <div>
                      <span className="text-muted-foreground">{t('admin.telegram.total')}:</span>{' '}
                      <span className="font-medium">{settings.lastFetchStatus.totalChannels}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('admin.telegram.successful')}:</span>{' '}
                      <span className="font-medium text-green-600">{settings.lastFetchStatus.channelsFetched}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('admin.telegram.failed')}:</span>{' '}
                      <span className="font-medium text-red-500">{settings.lastFetchStatus.channelsFailed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('admin.telegram.duration')}:</span>{' '}
                      <span className="font-medium">{(settings.lastFetchStatus.duration / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                  {settings.lastFetchStatus.errors.length > 0 && (
                    <div className="mt-2 space-y-0.5 max-h-32 overflow-y-auto">
                      {settings.lastFetchStatus.errors.map((err, i) => (
                        <div key={i} className="text-red-500">• {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monitored Channels */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-emerald-500" />
            {t('admin.telegram.monitoredChannels')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add channel */}
          <div className="flex gap-2">
            <Input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder={t('admin.telegram.addChannelPlaceholder')}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUsername(); } }}
            />
            <Button
              variant="outline"
              onClick={handleAddUsername}
              disabled={!newUsername.trim()}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" /> {t('admin.telegram.add')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('admin.telegram.channelDesc')}
          </p>

          {/* Channel list */}
          {settings.channelUsernames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('admin.telegram.noChannelsYet')}</p>
              <p className="text-xs">{t('admin.telegram.addChannelOrDiscover')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {settings.channelUsernames.map((username, idx) => (
                <div
                  key={username}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                      style={{ backgroundColor: stringToColor(username) }}
                    >
                      {username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-sm">@{username}</span>
                      <span className="text-xs text-muted-foreground ml-2">#{idx + 1}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleRemoveUsername(username)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {settings.channelUsernames.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {t('admin.telegram.total')} {settings.channelUsernames.length} {t('admin.telegram.totalChannels')}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFetch}
                disabled={isAnyFetching || !settings.botTokenSet || settings.channelUsernames.length === 0}
              >
                {fetching ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> {t('admin.telegram.fetching')}</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-1" /> {t('admin.telegram.fetchData')}</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper: Generate consistent color from string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}
