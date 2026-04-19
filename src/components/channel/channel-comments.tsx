'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { stringToColor, getInitials } from '@/lib/helpers';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send, Clock, LogIn } from 'lucide-react';

interface CommentUser {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  totalPages: number;
}

interface ChannelCommentsProps {
  channelId: number;
}

// Simple relative time helper (no date-fns dependency)
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
}

export function ChannelComments({ channelId }: ChannelCommentsProps) {
  const { t } = useI18n();
  const { user } = useAppStore();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const LIMIT = 10;

  const fetchComments = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`/api/comments?channelId=${channelId}&page=${pageNum}&limit=${LIMIT}`);
      if (!res.ok) throw new Error('Failed to fetch comments');

      const data: CommentsResponse = await res.json();

      if (append) {
        setComments((prev) => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error(t('comments.submitError'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [channelId, t]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!user) return;

    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          userId: user.id,
          content: trimmed,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit comment');
      }

      setContent('');
      toast.success(t('comments.submitted'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('comments.submitError');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage, true);
  };

  const hasMore = page < totalPages;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-[#229ED9]" />
        <h3 className="text-lg font-semibold">{t('comments.title')}</h3>
        {total > 0 && (
          <Badge variant="secondary" className="ml-1">
            {total}
          </Badge>
        )}
      </div>

      {/* Submit Comment Form */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback
                    style={{ backgroundColor: stringToColor(user.username || user.name) }}
                    className="text-white text-xs font-semibold"
                  >
                    {getInitials(user.name || user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('comments.placeholder')}
                    maxLength={1000}
                    rows={3}
                    className="resize-none"
                    disabled={submitting}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{t('comments.pendingApproval')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {t('comments.charCount', { count: content.length })}
                      </span>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={submitting || content.trim().length === 0 || content.length > 1000}
                        className="bg-[#229ED9] hover:bg-[#1a8bc4]"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {t('comments.submit')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Send className="h-3.5 w-3.5" />
                            {t('comments.submit')}
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
              <div className="rounded-full bg-muted p-3">
                <LogIn className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('comments.loginRequired')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="rounded-full bg-muted p-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('comments.noComments')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="transition-colors hover:bg-accent/30">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={comment.user.avatar || undefined} alt={comment.user.name} />
                    <AvatarFallback
                      style={{ backgroundColor: stringToColor(comment.user.username || comment.user.name) }}
                      className="text-white text-xs font-semibold"
                    >
                      {getInitials(comment.user.name || comment.user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                      <span className="text-sm font-medium truncate">
                        {comment.user.name || comment.user.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full sm:w-auto"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('comments.loading')}
                  </span>
                ) : (
                  t('comments.showMore')
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
