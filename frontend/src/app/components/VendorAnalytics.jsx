import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Package,
  ShoppingBag,
  RefreshCw,
  Filter,
  Clock,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/language';
import { toast } from 'sonner';

const PERIOD_SUBTITLE_KEYS = {
  '7d': 'analytics_period_7d',
  '30d': 'analytics_period_30d',
  '90d': 'analytics_period_90d',
  '1y': 'analytics_period_1y',
};

function computeGrowthPercent(series, key) {
  if (!series?.length) return 0;
  const mid = Math.max(1, Math.floor(series.length / 2));
  const first = series.slice(0, mid).reduce((s, d) => s + (d[key] || 0), 0);
  const second = series.slice(mid).reduce((s, d) => s + (d[key] || 0), 0);
  if (first === 0) return second > 0 ? 100 : 0;
  return Math.round(((second - first) / first) * 100);
}

function ChartTooltip({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border border-gray-100 dark:border-gray-600 px-4 py-3 shadow-xl"
      style={{
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#f3f4f6' : '#111827',
      }}
    >
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}:{' '}
          {entry.dataKey === 'orders'
            ? entry.value
            : `₹${Number(entry.value).toLocaleString()}`}
        </p>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, iconBg, iconColor, growth }) {
  const isUp = growth >= 0;
  return (
    <Card className="relative overflow-hidden border-none shadow-sm dark:bg-gray-800/90 p-5 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {growth !== undefined && growth !== null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
              isUp
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
            }`}
          >
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isUp ? '+' : ''}
            {growth}%
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </Card>
  );
}

export function VendorAnalytics() {
  const { t, tCategory } = useLang();
  const { theme } = useTheme();
  const TIMEFRAMES = [
    { id: '7d', label: t('timeframe_7d') },
    { id: '30d', label: t('timeframe_30d') },
    { id: '90d', label: t('timeframe_90d') },
    { id: '1y', label: t('timeframe_1y') },
  ];

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('7d');

  const fetchStats = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await api.vendor.getStats(timeframe);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        toast.error(t('err_load_analytics'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeframe, t]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const safeStats = useMemo(
    () => ({
      totalRevenue: stats?.totalRevenue ?? 0,
      totalOrders: stats?.totalOrders ?? 0,
      pendingOrders: stats?.pendingOrders ?? 0,
      totalRefunds: stats?.totalRefunds ?? 0,
      totalProducts: stats?.totalProducts ?? 0,
      revenueHistory: stats?.revenueHistory ?? [],
      categoryStats: stats?.categoryStats ?? [],
    }),
    [stats]
  );

  const revenueData = safeStats.revenueHistory;
  const categoryData = useMemo(() => {
    const raw = safeStats.categoryStats;
    const sum = raw.reduce((s, c) => s + (c.total || 0), 0);
    if (sum === 0) return [];
    return raw
      .map((c) => ({
        ...c,
        value: Math.round(((c.total || 0) / sum) * 100),
        displayName: tCategory(c.name),
      }))
      .sort((a, b) => b.total - a.total);
  }, [safeStats.categoryStats, tCategory]);

  const maxCategoryTotal = useMemo(
    () => Math.max(...categoryData.map((c) => c.total || 0), 1),
    [categoryData]
  );

  const avgOrderValue = safeStats.totalOrders
    ? Math.round(safeStats.totalRevenue / safeStats.totalOrders)
    : 0;

  const revenueGrowth = useMemo(
    () => computeGrowthPercent(revenueData, 'revenue'),
    [revenueData]
  );
  const ordersGrowth = useMemo(
    () => computeGrowthPercent(revenueData, 'orders'),
    [revenueData]
  );

  const maxRevenueDay = useMemo(() => {
    if (!revenueData.length) return null;
    return revenueData.reduce((best, d) =>
      (d.revenue || 0) > (best.revenue || 0) ? d : best
    );
  }, [revenueData]);

  const periodSubtitle = t(PERIOD_SUBTITLE_KEYS[timeframe] || PERIOD_SUBTITLE_KEYS['7d']);
  const gridStroke = theme === 'dark' ? '#374151' : '#e5e7eb';
  const tickFill = theme === 'dark' ? '#9ca3af' : '#6b7280';

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="p-12 text-center border-none dark:bg-gray-800">
        <p className="text-red-500 mb-4">{t('err_load_analytics')}</p>
        <Button onClick={() => fetchStats()} className="bg-green-600 hover:bg-green-700">
          {t('analytics_refresh')}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25">
              <BarChart3 className="h-5 w-5" />
            </span>
            {t('analytics_dashboard_title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 max-w-xl">
            {t('analytics_performance_sub')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 shadow-sm">
            <Filter className="h-4 w-4 text-gray-400 ml-2 shrink-0" />
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  timeframe === tf.id
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl border-gray-200 dark:border-gray-700"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            aria-label={t('analytics_refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={IndianRupee}
          label={t('analytics_kpi_revenue')}
          value={`₹${safeStats.totalRevenue.toLocaleString()}`}
          sub={t('analytics_growth_label')}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          growth={revenueGrowth}
        />
        <KpiCard
          icon={ShoppingBag}
          label={t('analytics_kpi_orders')}
          value={safeStats.totalOrders}
          sub={t('analytics_growth_label')}
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          iconColor="text-blue-600 dark:text-blue-400"
          growth={ordersGrowth}
        />
        <KpiCard
          icon={TrendingUp}
          label={t('analytics_kpi_avg_order')}
          value={`₹${avgOrderValue.toLocaleString()}`}
          iconBg="bg-violet-100 dark:bg-violet-900/40"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          icon={Clock}
          label={t('analytics_kpi_pending')}
          value={safeStats.pendingOrders}
          iconBg="bg-amber-100 dark:bg-amber-900/40"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          icon={RotateCcw}
          label={t('analytics_kpi_refunds')}
          value={`₹${safeStats.totalRefunds.toLocaleString()}`}
          iconBg="bg-rose-100 dark:bg-rose-900/40"
          iconColor="text-rose-600 dark:text-rose-400"
        />
        <KpiCard
          icon={Package}
          label={t('analytics_kpi_products')}
          value={safeStats.totalProducts}
          iconBg="bg-teal-100 dark:bg-teal-900/40"
          iconColor="text-teal-600 dark:text-teal-400"
        />
      </div>

      {/* Main charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 md:p-8 border-none shadow-sm dark:bg-gray-800/90">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">
                {t('revenue_orders_chart')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{periodSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-bold">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                {t('chart_revenue_legend')}
              </span>
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                {t('chart_orders_legend')}
              </span>
            </div>
          </div>

          <div className="h-[340px] w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vendorRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tickFill, fontSize: 12, fontWeight: 600 }}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="revenue"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tickFill, fontSize: 11 }}
                    tickFormatter={(v) => `₹${v}`}
                    width={56}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tickFill, fontSize: 11 }}
                    allowDecimals={false}
                    width={36}
                  />
                  <Tooltip content={<ChartTooltip theme={theme} />} />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name={t('analytics_revenue_tooltip')}
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#vendorRevenueFill)"
                  />
                  <Bar
                    yAxisId="orders"
                    dataKey="orders"
                    name={t('analytics_orders_tooltip')}
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                    opacity={0.9}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <BarChart3 className="h-12 w-12 opacity-30 mb-3" />
                <p>{t('start_selling_insights')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Category donut */}
        <Card className="p-6 md:p-8 border-none shadow-sm dark:bg-gray-800/90 flex flex-col">
          <h3 className="text-xl font-black text-gray-900 dark:text-white">
            {t('category_split')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
            {t('sales_distribution_category')}
          </p>

          {categoryData.length > 0 ? (
            <>
              <div className="h-52 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cat-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value}% · ₹${(props.payload?.total || 0).toLocaleString()}`,
                        props.payload?.displayName || name,
                      ]}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#111827' : '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {categoryData.length}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {t('analytics_top_categories')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-4 flex-1">
                {categoryData.slice(0, 6).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                        {cat.displayName}
                      </span>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white shrink-0">
                      {cat.value}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
              <Package className="h-10 w-10 opacity-40 mb-3" />
              <p className="text-sm">{t('analytics_no_category_data')}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 md:p-8 border-none shadow-sm bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-green-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-gray-300 mb-6">{t('analytics_insights')}</h3>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  {t('analytics_kpi_revenue')}
                </p>
                <p className="text-4xl font-black mt-1">₹{safeStats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs text-gray-400">{t('analytics_kpi_avg_order')}</p>
                  <p className="text-xl font-bold mt-1">₹{avgOrderValue}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs text-gray-400">{t('analytics_kpi_orders')}</p>
                  <p className="text-xl font-bold mt-1">{safeStats.totalOrders}</p>
                </div>
              </div>
              {maxRevenueDay && maxRevenueDay.revenue > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-emerald-300">{t('analytics_best_day')}</p>
                  <p className="text-lg font-black mt-1">
                    {maxRevenueDay.name} · ₹{maxRevenueDay.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('analytics_orders_count').replace(
                      '{count}',
                      String(maxRevenueDay.orders || 0)
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 md:p-8 border-none shadow-sm dark:bg-gray-800/90">
          <div className="mb-6">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {t('analytics_top_categories')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('analytics_top_categories_sub')}
            </p>
          </div>
          <div className="space-y-5">
            {categoryData.length > 0 ? (
              categoryData.map((cat) => (
                <div key={cat.name} className="group">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white dark:ring-gray-800"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                        {cat.displayName}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-gray-900 dark:text-white">
                        ₹{cat.total?.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {cat.value}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out min-w-[4px]"
                      style={{
                        width: `${Math.max(4, (cat.total / maxCategoryTotal) * 100)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>{t('analytics_no_category_data')}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
