import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { Card } from '../ui/card';
import { api } from '../../../lib/api';
import { AdminPanelShell } from './AdminPanelShell';
import { useLang } from '../../context/language';

export function AdminLogs() {
  const { t } = useLang();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .getLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPanelShell title={t('admin_logs')} subtitle={t('admin_logs_desc')} icon={ScrollText} loading={loading}>
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="max-h-[520px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
          {logs.length === 0 ? (
            <p className="p-8 text-center text-slate-500">{t('no_logs')}</p>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{log.action}</p>
                  <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {log.actorName} · {log.targetType} {log.targetId ? `#${String(log.targetId).slice(-6)}` : ''}
                </p>
                {log.details && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{log.details}</p>}
              </div>
            ))
          )}
        </div>
      </Card>
    </AdminPanelShell>
  );
}
