import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { toast } from 'sonner';
import { Store, CheckCircle2, XCircle, PauseCircle, Eye } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AdminPanelShell } from './AdminPanelShell';
import { useLang } from '../../context/language';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  suspended: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

export function AdminVendors() {
  const { t } = useLang();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      setVendors(await api.admin.getVendors());
    } catch {
      toast.error(t('err_load_vendors'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    try {
      await api.admin.updateVendorStatus(id, status);
      toast.success(t('vendor_status_updated'));
      load();
      if (selected?._id === id) setSelected(null);
    } catch (e) {
      toast.error(e.message || t('err_vendor_status'));
    }
  };

  return (
    <AdminPanelShell
      title={t('admin_vendor_mgmt')}
      subtitle={t('admin_vendor_mgmt_desc')}
      icon={Store}
      loading={loading}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {vendors.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">{t('no_vendors')}</Card>
          ) : (
            vendors.map((v) => (
              <Card
                key={v._id}
                className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {v.storeName || v.name}
                    </p>
                    <p className="text-sm text-slate-500">{v.email}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge className={STATUS_BADGE[v.vendorStatus] || STATUS_BADGE.pending}>
                        {t(`vendor_status_${v.vendorStatus}`) || v.vendorStatus}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {v.orderCount} {t('orders_label').toLowerCase()} · ₹{v.revenue?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelected(v)}>
                      <Eye size={14} /> {t('view')}
                    </Button>
                    {v.vendorStatus === 'pending' && (
                      <>
                        <Button size="sm" className="bg-emerald-600 gap-1" onClick={() => setStatus(v._id, 'approved')}>
                          <CheckCircle2 size={14} /> {t('approve')}
                        </Button>
                        <Button size="sm" variant="outline" className="text-rose-600 gap-1" onClick={() => setStatus(v._id, 'rejected')}>
                          <XCircle size={14} /> {t('reject')}
                        </Button>
                      </>
                    )}
                    {v.vendorStatus === 'approved' && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setStatus(v._id, 'suspended')}>
                        <PauseCircle size={14} /> {t('suspend')}
                      </Button>
                    )}
                    {(v.vendorStatus === 'suspended' || v.vendorStatus === 'rejected') && (
                      <Button size="sm" className="bg-emerald-600 gap-1" onClick={() => setStatus(v._id, 'approved')}>
                        <CheckCircle2 size={14} /> {t('approve')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        {selected && (
          <Card className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl h-fit sticky top-4">
            <p className="text-xs font-bold uppercase text-slate-400 mb-3">{t('vendor_details')}</p>
            <p className="font-black text-lg text-slate-900 dark:text-white">{selected.storeName || selected.name}</p>
            <p className="text-sm text-slate-500 mt-2">{selected.email}</p>
            <p className="text-sm text-slate-500">{selected.phoneNumber || '—'}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{selected.storeDescription || '—'}</p>
            <p className="text-sm text-slate-500 mt-3">{selected.address || '—'}</p>
            <p className="text-xs text-slate-400 mt-4">
              {t('joined_date')}: {new Date(selected.createdAt).toLocaleDateString()}
            </p>
          </Card>
        )}
      </div>
    </AdminPanelShell>
  );
}
