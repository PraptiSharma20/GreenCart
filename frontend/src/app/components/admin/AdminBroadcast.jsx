import { useState, useEffect } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { api } from '../../../lib/api';
import { toast } from 'sonner';
import { AdminPanelShell } from './AdminPanelShell';
import { useLang } from '../../context/language';

export function AdminBroadcast() {
  const { t } = useLang();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getAnnouncements().then(setHistory).finally(() => setLoading(false));
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error(t('broadcast_required'));
      return;
    }
    setSending(true);
    try {
      const created = await api.admin.broadcast({ title, message, audience });
      toast.success(`${t('broadcast_sent')} (${created.recipientCount})`);
      setTitle('');
      setMessage('');
      setHistory(await api.admin.getAnnouncements());
    } catch (e) {
      toast.error(e.message || t('err_broadcast'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminPanelShell
      title={t('admin_broadcast')}
      subtitle={t('admin_broadcast_desc')}
      icon={Megaphone}
      loading={loading}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <form onSubmit={send} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('broadcast_audience')}</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="all">{t('broadcast_all')}</option>
                <option value="customers">{t('broadcast_customers')}</option>
                <option value="vendors">{t('broadcast_vendors')}</option>
              </select>
            </div>
            <Input placeholder={t('broadcast_title_ph')} value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea rows={5} placeholder={t('broadcast_msg_ph')} value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button type="submit" className="w-full gap-2 bg-emerald-600" disabled={sending}>
              <Send size={16} />
              {sending ? t('sending') : t('broadcast_send')}
            </Button>
          </form>
        </Card>
        <Card className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-400 mb-4">{t('broadcast_history')}</p>
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">{t('no_broadcasts')}</p>
            ) : (
              history.map((a) => (
                <div key={a._id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.message}</p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {a.audience} · {a.recipientCount} {t('recipients')} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AdminPanelShell>
  );
}
