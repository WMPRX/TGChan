'use client';

import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { formatMemberCount, getLanguageCode, getRankChange, stringToColor, getInitials } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Minus, Crown, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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

interface ChannelTableProps {
  channels: Channel[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ChannelTable({ channels, total, page, totalPages, onPageChange }: ChannelTableProps) {
  const { t } = useI18n();
  const { setSelectedChannelId, setCurrentView } = useAppStore();

  const handleChannelClick = (id: number) => {
    setSelectedChannelId(id);
    setCurrentView('channels');
  };

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-3 text-left w-12">{t('home.table.rank')}</th>
              <th className="py-3 px-3 text-left">{t('home.table.name')}</th>
              <th className="py-3 px-3 text-right">{t('home.table.members')}</th>
              <th className="py-3 px-3 text-center w-24">{t('home.table.language')}</th>
              <th className="py-3 px-3 text-center w-20">{t('home.table.change')}</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel, idx) => {
              const rankChange = getRankChange(channel.rank, channel.previousRank);
              const isPremium = channel.isPremium;
              // Always use position-based rank for display; stored rank is for rank-change arrows only
              const displayRank = idx + 1;

              return (
                <tr
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.id)}
                  className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${
                    isPremium ? 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20' : ''
                  }`}
                  style={isPremium && channel.highlightColor ? {
                    borderLeft: `3px solid ${channel.highlightColor}`,
                  } : undefined}
                >
                  {/* Rank */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-muted-foreground">{displayRank}</span>
                      {rankChange.direction === 'up' && (
                        <ArrowUp className="h-3 w-3 text-green-500" />
                      )}
                      {rankChange.direction === 'down' && (
                        <ArrowDown className="h-3 w-3 text-red-500" />
                      )}
                      {rankChange.direction === 'same' && (
                        <Minus className="h-3 w-3 text-muted-foreground/50" />
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={channel.avatarUrl || undefined} alt={channel.title} />
                        <AvatarFallback
                          style={{ backgroundColor: stringToColor(channel.username) }}
                          className="text-white text-xs font-semibold"
                        >
                          {getInitials(channel.title)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">{channel.title}</span>
                          {channel.isVerified && (
                            <svg className="h-4 w-4 text-[#229ED9] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                          )}
                          {channel.hasBadge && isPremium && (
                            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                          {isPremium && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              PRO
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">@{channel.username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Members */}
                  <td className="py-3 px-3 text-right">
                    <span className="text-sm font-medium">{formatMemberCount(channel.memberCount, t)}</span>
                  </td>

                  {/* Language */}
                  <td className="py-3 px-3 text-center">
                    <Badge variant="outline" className="text-xs font-medium">
                      {getLanguageCode(channel.language)}
                    </Badge>
                  </td>

                  {/* Change */}
                  <td className="py-3 px-3 text-center">
                    {rankChange.direction === 'up' && (
                      <span className="text-xs font-medium text-green-500">▲{rankChange.value}</span>
                    )}
                    {rankChange.direction === 'down' && (
                      <span className="text-xs font-medium text-red-500">▼{rankChange.value}</span>
                    )}
                    {rankChange.direction === 'same' && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y">
        {channels.map((channel, idx) => {
          const rankChange = getRankChange(channel.rank, channel.previousRank);
          const isPremium = channel.isPremium;
          // Always use position-based rank for display; stored rank is for rank-change arrows only
          const displayRank = idx + 1;

          return (
            <div
              key={channel.id}
              onClick={() => handleChannelClick(channel.id)}
              className={`flex items-center gap-3 py-3 px-4 cursor-pointer active:bg-muted/50 ${
                isPremium ? 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20' : ''
              }`}
              style={isPremium && channel.highlightColor ? {
                borderLeft: `3px solid ${channel.highlightColor}`,
              } : undefined}
            >
              <span className="text-sm font-medium text-muted-foreground w-6 text-center">{displayRank}</span>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={channel.avatarUrl || undefined} alt={channel.title} />
                <AvatarFallback
                  style={{ backgroundColor: stringToColor(channel.username) }}
                  className="text-white text-xs font-semibold"
                >
                  {getInitials(channel.title)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm truncate">{channel.title}</span>
                  {channel.isVerified && (
                    <svg className="h-3.5 w-3.5 text-[#229ED9] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  )}
                  {channel.hasBadge && isPremium && (
                    <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">@{channel.username}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-medium">{formatMemberCount(channel.memberCount, t)}</div>
                <div className="flex items-center justify-end gap-1">
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{getLanguageCode(channel.language)}</Badge>
                  {rankChange.direction === 'up' && <ArrowUp className="h-3 w-3 text-green-500" />}
                  {rankChange.direction === 'down' && <ArrowDown className="h-3 w-3 text-red-500" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            {total} {t('home.channelsCount')}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
