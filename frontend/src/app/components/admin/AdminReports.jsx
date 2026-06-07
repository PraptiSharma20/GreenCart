import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card } from '../ui/card';
import { api } from '../../../lib/api';
import { AdminPanelShell } from './AdminPanelShell';
import { useLang } from '../../context/language';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';

export function AdminReports() {
  const { t } = useLang();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getReports().then(setReport).finally(() => setLoading(false));
  }, []);

  const kpis = report
    ? [
        { label: t('revenue'), value: `₹${report.totalRevenue?.toLocaleString()}` },
        { label: t('total_orders'), value: report.ordersCount },
        { label: t('total_users'), value: report.usersCount },
        { label: t('total_products'), value: report.productsCount },
        { label: t('dist_vendors'), value: report.vendors },
        { label: t('dist_customers'), value: report.customers },
      ]
    : [];

  return (
    <AdminPanelShell
      title={t('admin_reports')}
      subtitle={t('admin_reports_desc')}
      icon={BarChart3}
      loading={loading}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-400">{k.label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{k.value}</p>
          </Card>
        ))}
      </div>
      {report?.monthly?.length > 0 && (
        <Card className="p-6 mt-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="font-black text-slate-900 dark:text-white mb-4">{t('admin_monthly_trend')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={report.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      {report?.ordersByStatus && (
        <Card className="p-6 mt-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="font-black mb-4">{t('admin_order_pipeline')}</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(report.ordersByStatus).map(([status, count]) => (
              <span key={status} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold">
                {status}: {count}
              </span>
            ))}
          </div>
        </Card>
      )}
    </AdminPanelShell>
  );
}
