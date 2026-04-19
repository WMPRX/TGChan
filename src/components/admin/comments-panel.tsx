import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { stringToColor, getInitials } from '@/lib/helpers';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  MessageSquare,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ---- Types ----

type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface CommentChannel {
  id: number;
  title: string;
  username: string;
  avatarUrl: string | null;
}

interface CommentUser {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
}

interface Reviewer {
  id: number;
  name: string;
  username: string;
}

interface AdminComment {
  id: number;
  content: string;
  status: CommentStatus;
  rejectReason: string | null;
  createdAt: string;
  channelId: number;
  userId: number;
  reviewerId: number | null;
  channel: CommentChannel;
  user: CommentUser;
  reviewer: Reviewer | null;
}

interface CommentsStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface CommentsResponse {
  comments: AdminComment[];
  stats: CommentsStats;
  page: number;
  totalPages: number;
  total: number;
}

// ---- Helper ----

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

const statusColors: Record<CommentStatus, string> = {
  PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusIcons: Record<CommentStatus, React.ElementType> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
};

// ---- Main Component ----

export default function CommentsPanel() {
  const { t } = useI18n();
  const { user } = useAppStore();

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [stats, setStats] = useState<CommentsStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | CommentStatus>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reject dialog state
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    id: number | null;
    reason: string;
  }>({ open: false, id: null, reason: '' });

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Action loading states
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      const res = await fetch(`/api/admin/comments?${params.toString()}`);
      if (res.ok) {
        const data: CommentsResponse = await res.json();
        setComments(data.comments || []);
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleApprove = async (commentId: number) => {
    if (!user) return;
    setActionLoading(commentId);
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          action: 'APPROVE',
          reviewerId: user.id,
        }),
      });
      if (res.ok) {
        toast.success(t('admin.comments.approvedSuccess'));
        fetchComments();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!user || !rejectDialog.id) return;
    setActionLoading(rejectDialog.id);
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rejectDialog.id,
          action: 'REJECT',
          reviewerId: user.id,
          rejectReason: rejectDialog.reason || undefined,
        }),
      });
      if (res.ok) {
        toast.success(t('admin.comments.rejectedSuccess'));
        setRejectDialog({ open: false, id: null, reason: '' });
        fetchComments();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      const res = await fetch(`/api/admin/comments?id=${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('admin.comments.deletedSuccess'));
        setDeleteId(null);
        fetchComments();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Render ----

  const statCards = [
    { label: t('admin.comments.pending'), value: stats.pending, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: t('admin.comments.approved'), value: stats.approved, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: t('admin.comments.rejected'), value: stats.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const filterTabs: { key: 'ALL' | CommentStatus; label: string }[] = [
    { key: 'ALL', label: t('admin.comments.all') },
    { key: 'PENDING', label: t('admin.comments.pending') },
    { key: 'APPROVED', label: t('admin.comments.approved') },
    { key: 'REJECTED', label: t('admin.comments.rejected') },
  ];

  const deleteComment = comments.find((c) => c.id === deleteId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#229ED9]" />
          {t('admin.comments')}
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
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

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'text-[#229ED9] bg-[#229ED9]/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {tab.key === 'PENDING' && <Clock className="h-3.5 w-3.5" />}
            {tab.key === 'APPROVED' && <CheckCircle className="h-3.5 w-3.5" />}
            {tab.key === 'REJECTED' && <XCircle className="h-3.5 w-3.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
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
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="rounded-full bg-muted p-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('admin.comments.noComments')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-sm font-medium text-muted-foreground p-3">{t('admin.comments.commentDetails')}</th>
                    <th className="text-center text-sm font-medium text-muted-foreground p-3">{t('admin.comments.on')}</th>
                    <th className="text-center text-sm font-medium text-muted-foreground p-3">Status</th>
                    <th className="text-right text-sm font-medium text-muted-foreground p-3">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((comment) => {
                    const StatusIcon = statusIcons[comment.status];
                    const isLoading = actionLoading === comment.id;
                    return (
                      <tr key={comment.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="p-3">
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
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm truncate">{comment.user.name}</span>
                                <span className="text-xs text-muted-foreground">@{comment.user.username}</span>
                              </div>
                              <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words line-clamp-2">
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{getRelativeTime(comment.createdAt)}</span>
                              </div>
                              {comment.reviewer && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <Eye className="h-3 w-3" />
                                  <span>{t('admin.comments.reviewedBy')} {comment.reviewer.name}</span>
                                </div>
                              )}
                              {comment.rejectReason && (
                                <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                                  {comment.rejectReason}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-medium truncate max-w-[150px]">{comment.channel.title}</span>
                            <span className="text-xs text-muted-foreground">@{comment.channel.username}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={`${statusColors[comment.status]} gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {t(`admin.comments.${comment.status.toLowerCase()}`)}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {comment.status !== 'APPROVED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={() => handleApprove(comment.id)}
                                disabled={isLoading}
                                title={t('admin.comments.approve')}
                              >
                                {isLoading ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {comment.status !== 'REJECTED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                onClick={() => setRejectDialog({ open: true, id: comment.id, reason: '' })}
                                disabled={isLoading}
                                title={t('admin.comments.reject')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(comment.id)}
                              disabled={isLoading}
                              title={t('admin.comments.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
            {comments.map((comment) => {
              const StatusIcon = statusIcons[comment.status];
              const isLoading = actionLoading === comment.id;
              return (
                <Card key={comment.id}>
                  <CardContent className="p-4">
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-sm truncate">{comment.user.name}</span>
                          <span className="text-xs text-muted-foreground">@{comment.user.username}</span>
                        </div>
                        <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{getRelativeTime(comment.createdAt)}</span>
                          <span className="mx-1">·</span>
                          <span>{t('admin.comments.on')} <span className="font-medium">{comment.channel.title}</span></span>
                        </div>
                        {comment.reviewer && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            <span>{t('admin.comments.reviewedBy')} {comment.reviewer.name}</span>
                          </div>
                        )}
                        {comment.rejectReason && (
                          <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                            {comment.rejectReason}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={`${statusColors[comment.status]} gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {t(`admin.comments.${comment.status.toLowerCase()}`)}
                          </Badge>
                          <div className="flex items-center gap-1 ml-auto">
                            {comment.status !== 'APPROVED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={() => handleApprove(comment.id)}
                                disabled={isLoading}
                                title={t('admin.comments.approve')}
                              >
                                {isLoading ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                            {comment.status !== 'REJECTED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                onClick={() => setRejectDialog({ open: true, id: comment.id, reason: '' })}
                                disabled={isLoading}
                                title={t('admin.comments.reject')}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(comment.id)}
                              disabled={isLoading}
                              title={t('admin.comments.delete')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('common.page') || 'Page'} {page} / {totalPages}
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

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) setRejectDialog({ open: false, id: null, reason: '' });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.comments.reject')}</DialogTitle>
            <DialogDescription>
              {t('admin.comments.rejectReason')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder={t('admin.comments.rejectReasonPlaceholder')}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, id: null, reason: '' })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading !== null}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {actionLoading !== null ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('admin.comments.reject')}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  {t('admin.comments.reject')}
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.comments.delete')}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteComment
                ? t('admin.comments.confirmDelete')
                : t('admin.comments.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('admin.comments.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
