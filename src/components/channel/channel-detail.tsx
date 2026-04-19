'use client';

import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { formatMemberCount, getLanguageCode, getLanguageFlag, stringToColor, getInitials, parseI18nField } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Crown, ExternalLink, TrendingUp, Users, Calendar, BarChart3, CheckCircle2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ChannelComments } from '@/components/channel/channel-comments';

interface ChannelDetailProps {
  channel: {
    id: number;
    username: string;
    title: string;
    description: string | null;
    type: string;
    avatarUrl: string | null;
    memberCount: number;
    language: string;
    isVerified: boolean;
    isPremium: boolean;
    hasBadge: boolean;
    dailyGrowth: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
    category: { id: number; name: string; slug: string; icon: string | null } | null;
    tags: { id: number; name: string; slug: string }[];
  } | null;
}

export function ChannelDetail({ channel }: ChannelDetailProps) {
  const { t, language } = useI18n();
  const { navigate } = useAppStore();

  if (!channel) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t('common.noResults')}</p>
      </div>
    );
  }

  const categoryName = channel.category ? parseI18nField(channel.category.name, language) : null;

  // Simulated growth data for mini chart
  const growthData = [
    channel.memberCount - channel.monthlyGrowth * 0.8,
    channel.memberCount - channel.monthlyGrowth * 0.6,
    channel.memberCount - channel.monthlyGrowth * 0.4,
    channel.memberCount - channel.monthlyGrowth * 0.2,
    channel.memberCount - channel.weeklyGrowth,
    channel.memberCount - channel.dailyGrowth * 3,
    channel.memberCount,
  ];
  const maxVal = Math.max(...growthData);
  const minVal = Math.min(...growthData);
  const range = maxVal - minVal || 1;

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/channel/${channel.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <button
        onClick={() => navigate('/channels')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </button>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        <Avatar className="h-20 w-20 shrink-0 ring-2 ring-background shadow-md">
          <AvatarImage src={channel.avatarUrl || undefined} alt={channel.title} />
          <AvatarFallback
            style={{ backgroundColor: stringToColor(channel.username) }}
            className="text-white text-2xl font-bold"
          >
            {getInitials(channel.title)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold truncate">{channel.title}</h1>
            {channel.isVerified && (
              <CheckCircle2 className="h-5 w-5 text-[#229ED9] shrink-0" />
            )}
            {channel.hasBadge && channel.isPremium && (
              <Crown className="h-5 w-5 text-amber-500 shrink-0" />
            )}
          </div>
          <div className="text-muted-foreground mb-2">@{channel.username}</div>
          {channel.description && (
            <p className="text-sm text-muted-foreground mb-4 max-w-2xl">{channel.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`https://t.me/${channel.username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-[#229ED9] hover:bg-[#1a8bc4]">
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('channels.joinTelegram')}
              </Button>
            </a>
            <Button variant="outline" size="icon" title="Share" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {channel.isPremium && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Crown className="h-3 w-3 mr-1" /> PRO
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-[#229ED9]" />
              <span className="text-xs text-muted-foreground">{t('channels.members')}</span>
            </div>
            <div className="text-xl font-bold">{formatMemberCount(channel.memberCount, t)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">{t('channels.dailyGrowth')}</span>
            </div>
            <div className={`text-xl font-bold ${channel.dailyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {channel.dailyGrowth >= 0 ? '+' : ''}{formatMemberCount(channel.dailyGrowth, t)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">{t('channels.weeklyGrowth')}</span>
            </div>
            <div className={`text-xl font-bold ${channel.weeklyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {channel.weeklyGrowth >= 0 ? '+' : ''}{formatMemberCount(channel.weeklyGrowth, t)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">{t('channels.monthlyGrowth')}</span>
            </div>
            <div className={`text-xl font-bold ${channel.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {channel.monthlyGrowth >= 0 ? '+' : ''}{formatMemberCount(channel.monthlyGrowth, t)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart (Simple SVG) */}
      <Card className="mb-8">
        <CardContent className="pt-4 pb-4 px-4">
          <h3 className="font-semibold text-sm mb-4">{t('channels.memberHistory')}</h3>
          <div className="h-32 w-full">
            <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#229ED9" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#229ED9" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d={`M 0 ${100 - ((growthData[0] - minVal) / range) * 80 - 10} ${growthData
                  .map((val, i) => {
                    const x = (i / (growthData.length - 1)) * 300;
                    const y = 100 - ((val - minVal) / range) * 80 - 10;
                    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                  })
                  .join(' ')
                  .replace('M 0', 'L 0')} L 300 100 L 0 100 Z`}
                fill="url(#chartGradient)"
              />
              {/* Line */}
              <path
                d={growthData
                  .map((val, i) => {
                    const x = (i / (growthData.length - 1)) * 300;
                    const y = 100 - ((val - minVal) / range) * 80 - 10;
                    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#229ED9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Last point dot */}
              <circle
                cx="300"
                cy={100 - ((growthData[growthData.length - 1] - minVal) / range) * 80 - 10}
                r="3"
                fill="#229ED9"
              />
            </svg>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>30d ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-4 pb-4 px-4 space-y-3">
            <h3 className="font-semibold text-sm">{t('channels.details')}</h3>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('channels.type')}</span>
              <Badge variant="outline">{channel.type === 'CHANNEL' ? t('channels.channel') : channel.type === 'GROUP' ? t('channels.group') : t('channels.supergroup')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('channels.language')}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{getLanguageFlag(channel.language)}</span>
                <Badge variant="outline">{getLanguageCode(channel.language)}</Badge>
              </div>
            </div>
            {categoryName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('channels.category')}</span>
                <span className="text-sm font-medium">{channel.category?.icon} {categoryName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('channels.verified')}</span>
              <span className={`text-sm ${channel.isVerified ? 'text-green-500' : 'text-muted-foreground'}`}>
                {channel.isVerified ? '✓' : '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        {channel.tags && channel.tags.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              <h3 className="font-semibold text-sm">{t('channels.tags')}</h3>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {channel.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="hover:bg-[#229ED9]/10 cursor-pointer">
                    {parseI18nField(tag.name, language) || tag.slug}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <ChannelComments channelId={channel.id} />
      </div>
    </div>
  );
}
