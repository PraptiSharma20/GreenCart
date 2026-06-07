import { useState, useEffect } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { Card } from '../ui/card';
import { api } from '../../../lib/api';
import { AdminPanelShell } from './AdminPanelShell';
import { useLang } from '../../context/language';

export function AdminNotifications({ onNavigateTab }) {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .getNotificationCenter()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPanelShell
      title={t('admin_notifications')}
      subtitle={t('admin_notifications_desc')}
      icon={Bell}
      loading={loading}
    >
      {!data?.items?.length ? (
        <Card className="p-10 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500">{t('admin_no_alerts')}</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.items.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onNavigateTab?.(item.tab)}
              className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 transition-colors text-left"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{item.count}</p>
              </div>
              <ChevronRight className="text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </AdminPanelShell>
  );
}
