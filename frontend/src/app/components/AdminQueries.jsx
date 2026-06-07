import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Send,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { useLang } from '../context/language';
import { ConfirmDialog } from './ui/confirm-dialog';

function mailtoReplyUrl(query) {
  const subject = encodeURIComponent(`Re: ${query.subject}`);
  const priorReplies = (query.replies || [])
    .map((r) => r.message)
    .filter(Boolean)
    .join('\n\n');
  const body = encodeURIComponent(
    `Hi ${query.name},\n\nThank you for contacting GreenCart regarding "${query.subject}".\n\n${
      priorReplies ? `Our response:\n${priorReplies}\n\n` : ''
    }`
  );
  return `mailto:${query.email}?subject=${subject}&body=${body}`;
}

function queryHasLinkedAccount(query) {
  return Boolean(query.user?._id || query.user || query.canReachInApp);
}

export function AdminQueries() {
  const { t } = useLang();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [markResolvedOnReply, setMarkResolvedOnReply] = useState({});
  const [sendingId, setSendingId] = useState(null);
  const [queryToDelete, setQueryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const data = await api.queries.getAll();
      setQueries(data);
    } catch {
      toast.error(t('err_load_queries'));
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.queries.resolve(id);
      setQueries(queries.map((q) => (q._id === id ? { ...q, status: 'resolved' } : q)));
      toast.success(t('err_query_resolved'));
    } catch {
      toast.error(t('err_resolve_query'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!queryToDelete) return;
    setDeleting(true);
    try {
      await api.queries.delete(queryToDelete._id);
      setQueries(queries.filter((q) => q._id !== queryToDelete._id));
      setQueryToDelete(null);
      toast.success(t('err_query_deleted'));
    } catch {
      toast.error(t('err_delete_query'));
    } finally {
      setDeleting(false);
    }
  };

  const handleReply = async (query) => {
    const text = (replyDrafts[query._id] || '').trim();
    if (!text) {
      toast.error(t('query_reply_required'));
      return;
    }
    setSendingId(query._id);
    try {
      const updated = await api.queries.reply(query._id, {
        message: text,
        markResolved: markResolvedOnReply[query._id] !== false,
      });
      setQueries(queries.map((q) => (q._id === query._id ? updated : q)));
      setReplyDrafts((d) => ({ ...d, [query._id]: '' }));
      if (updated.notifiedInApp) {
        toast.success(t('query_reply_sent_inapp'));
      } else {
        toast.warning(t('query_reply_email_only'), { duration: 8000 });
      }
    } catch {
      toast.error(t('err_query_reply'));
    } finally {
      setSendingId(null);
    }
  };

  const contactTypeLabel = (type) => {
    if (type === 'Vendor') return t('contact_type_vendor');
    if (type === 'Client') return t('contact_type_client');
    return t('na');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-emerald-600" />
            {t('contact_queries')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('query_admin_help')}</p>
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {queries.length} {queries.length === 1 ? t('query_single') : t('queries_total')}
        </p>
      </div>

      <div className="grid gap-4">
        {queries.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <MessageSquare className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-lg">{t('no_queries')}</p>
          </Card>
        ) : (
          queries.map((query) => {
            const hasLinkedUser = queryHasLinkedAccount(query);
            const replies = query.replies || [];
            const isPending = query.status !== 'resolved';
            const savedOnlyReplies = replies.length > 0 && !hasLinkedUser;

            return (
              <Card
                key={query._id}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {query.subject}
                        </h3>
                        <Badge
                          className={
                            isPending
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }
                        >
                          {isPending ? t('status_pending_label') : t('status_resolved')}
                        </Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-3 leading-relaxed whitespace-pre-wrap">
                        {query.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {t('query_from')}:
                      </span>{' '}
                      {query.name}
                    </span>
                    <span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {t('query_email')}:
                      </span>{' '}
                      {query.email}
                    </span>
                    <Badge
                      className={
                        query.contactType === 'Vendor'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
                      }
                    >
                      {contactTypeLabel(query.contactType)}
                    </Badge>
                    <span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {t('query_date')}:
                      </span>{' '}
                      {new Date(query.createdAt).toLocaleString()}
                    </span>
                    {hasLinkedUser && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        {t('query_linked_account')}
                      </span>
                    )}
                  </div>

                  {replies.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('query_reply_history')}
                      </p>
                      {replies.map((r, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 px-4 py-3"
                        >
                          <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {r.message}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                            {r.adminName || 'Admin'} ·{' '}
                            {new Date(r.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {savedOnlyReplies && (
                    <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                      {t('query_saved_replies_warning')}
                    </div>
                  )}

                  {isPending && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageCircle size={16} className="text-emerald-600" />
                      {t('query_reply_title')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {hasLinkedUser ? t('query_reply_inapp_hint') : t('query_reply_email_hint')}
                    </p>
                    <Textarea
                      rows={4}
                      placeholder={t('query_reply_placeholder')}
                      value={replyDrafts[query._id] || ''}
                      onChange={(e) =>
                        setReplyDrafts((d) => ({ ...d, [query._id]: e.target.value }))
                      }
                      className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 resize-y min-h-[100px]"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={markResolvedOnReply[query._id] !== false}
                        onChange={(e) =>
                          setMarkResolvedOnReply((m) => ({
                            ...m,
                            [query._id]: e.target.checked,
                          }))
                        }
                      />
                      {t('query_mark_resolved_after_reply')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {hasLinkedUser ? (
                        <Button
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={sendingId === query._id}
                          onClick={() => handleReply(query)}
                        >
                          {sendingId === query._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                          {t('query_send_reply')}
                        </Button>
                      ) : (
                        <a
                          href={mailtoReplyUrl(query)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md font-medium bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                        >
                          <Mail size={16} />
                          {t('query_email_user_primary')}
                        </a>
                      )}
                      {!hasLinkedUser && (
                        <Button
                          variant="outline"
                          className="gap-2"
                          disabled={sendingId === query._id}
                          onClick={() => handleReply(query)}
                        >
                          {sendingId === query._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                          {t('query_save_internal_note')}
                        </Button>
                      )}
                      {hasLinkedUser && (
                        <a
                          href={mailtoReplyUrl(query)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                        >
                          <Mail size={16} />
                          {t('query_email_user')}
                        </a>
                      )}
                      {isPending && (
                        <Button
                          variant="outline"
                          className="gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                          onClick={() => handleResolve(query._id)}
                        >
                          <CheckCircle2 size={16} />
                          {t('query_resolve_only')}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="gap-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 ml-auto sm:ml-0"
                        onClick={() => setQueryToDelete(query)}
                      >
                        <Trash2 size={16} />
                        {t('query_delete')}
                      </Button>
                    </div>
                  </div>
                  )}

                  {!isPending && replies.length > 0 && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      {t('query_resolved_no_more_replies')}
                    </p>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!queryToDelete}
        onClose={() => !deleting && setQueryToDelete(null)}
        onConfirm={handleConfirmDelete}
        closeOnConfirm={false}
        isLoading={deleting}
        title={t('query_delete_confirm_title')}
        message={t('confirm_delete_query')}
        detail={
          queryToDelete
            ? {
                label: t('query_delete_confirm_detail'),
                value: `"${queryToDelete.subject}"`,
                sub: `${queryToDelete.name} · ${queryToDelete.email}`,
              }
            : null
        }
        confirmText={deleting ? t('query_deleting') : t('query_delete_confirm_btn')}
        cancelText={t('cancel')}
        variant="danger"
      />
    </div>
  );
}
