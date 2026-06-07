import { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api } from '../../../lib/api';
import { toast } from 'sonner';
import { AdminPanelShell } from './AdminPanelShell';
import { useLang } from '../../context/language';

export function AdminRefunds() {
  const { t, tStatus } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const load = async () => {
    try {
      setOrders(await api.admin.getRefunds());
    } catch {
      toast.error(t('err_load_refunds'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const process = async (id) => {
    setProcessing(id);
    try {
      await api.admin.processRefund(id);
      toast.success(t('refund_processed'));
      load();
    } catch (e) {
      toast.error(e.message || t('err_refund_process'));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AdminPanelShell
      title={t('admin_refunds')}
      subtitle={t('admin_refunds_desc')}
      icon={IndianRupee}
      loading={loading}
    >
      <div className="space-y-3">
        {orders.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 rounded-2xl">{t('no_refund_requests')}</Card>
        ) : (
          orders.map((o) => (
            <Card key={o._id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  #{o._id.toString().slice(-6).toUpperCase()} · {o.user?.name || 'Guest'}
                </p>
                <p className="text-sm text-slate-500">{o.user?.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge>{tStatus(o.status) || o.status}</Badge>
                  <span className="text-sm font-bold">₹{(o.totalPrice || 0).toLocaleString()}</span>
                  <span className="text-xs text-slate-400">{o.paymentMethod}</span>
                </div>
              </div>
              {o.status !== 'Refunded' && (
                <Button
                  className="gap-2 bg-emerald-600"
                  disabled={processing === o._id}
                  onClick={() => process(o._id)}
                >
                  <CheckCircle2 size={16} />
                  {t('process_refund')}
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </AdminPanelShell>
  );
}
