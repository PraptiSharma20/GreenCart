import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Users as UsersIcon,
  ShoppingCart,
  Package,
  TrendingUp,
  LayoutDashboard,
  LogOut,
  Loader2,
  Menu,
  Moon,
  Sun,
  Globe,
  Tag,
  MessageSquare,
  Shield,
  ClipboardList,
  RefreshCw,
  ArrowRight,
  Activity,
  Store,
  ChevronRight,
  Bell,
  IndianRupee,
  Star,
  ScrollText,
  Megaphone,
  BarChart3,
  PackageX,
  Trophy,
} from 'lucide-react';
import { useLang } from '../context/language';
import { useTheme } from '../context/ThemeContext';
import { languages } from '../i18n/languages';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { AdminUsers } from '../components/AdminUsers';
import { AdminProducts } from '../components/AdminProducts';
import { AdminOrders } from '../components/AdminOrders';
import { AdminCoupons } from '../components/AdminCoupons';
import { AdminQueries } from '../components/AdminQueries';
import { AdminVendors } from '../components/admin/AdminVendors';
import { AdminNotifications } from '../components/admin/AdminNotifications';
import { AdminRefunds } from '../components/admin/AdminRefunds';
import { AdminReports } from '../components/admin/AdminReports';
import { AdminReviews } from '../components/admin/AdminReviews';
import { AdminLogs } from '../components/admin/AdminLogs';
import { AdminBroadcast } from '../components/admin/AdminBroadcast';
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

const VALID_TABS = [
  'overview',
  'users',
  'products',
  'orders',
  'coupons',
  'queries',
  'vendors',
  'notifications',
  'refunds',
  'reports',
  'reviews',
  'logs',
  'broadcast',
];

const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Out for Delivery': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  Delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  Refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

function AdminChartTooltip({ active, payload, label, theme, t }) {
  if (!active || !payload?.length) return null;
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-xl ${
        isDark
          ? 'bg-slate-900 border-slate-700 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.dataKey === 'revenue'
            ? `${t('revenue_label')}: ₹${Number(entry.value).toLocaleString()}`
            : `${t('orders_label')}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, tStatus, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();

  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [langOpen, setLangOpen] = useState(false);

  const tab = VALID_TABS.includes(searchParams.get('tab') || '')
    ? searchParams.get('tab')
    : 'overview';

  const setTab = (id) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [data, insightData] = await Promise.all([
        api.admin.getStats(),
        api.admin.getInsights().catch(() => null),
      ]);
      setStats(data);
      setInsights(insightData);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      toast.error(t('err_load_admin_stats'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [user, navigate, fetchStats]);

  const menuItems = useMemo(
    () => [
      { id: 'overview', label: t('tab_overview'), icon: LayoutDashboard },
      { id: 'users', label: t('user_management'), icon: UsersIcon },
      { id: 'products', label: t('products'), icon: Package },
      { id: 'orders', label: t('orders'), icon: ShoppingCart },
      { id: 'coupons', label: t('coupons'), icon: Tag },
      { id: 'queries', label: t('tab_queries'), icon: MessageSquare },
      { id: 'vendors', label: t('tab_vendors'), icon: Store },
      { id: 'notifications', label: t('tab_notifications'), icon: Bell },
      { id: 'refunds', label: t('tab_refunds'), icon: IndianRupee },
      { id: 'reports', label: t('tab_reports'), icon: BarChart3 },
      { id: 'reviews', label: t('tab_reviews'), icon: Star },
      { id: 'logs', label: t('tab_logs'), icon: ScrollText },
      { id: 'broadcast', label: t('tab_broadcast'), icon: Megaphone },
    ],
    [t]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success(t('logout_success') || 'Logged out');
  };

  const isDark = theme === 'dark';
  const chartGrid = isDark ? '#334155' : '#e2e8f0';
  const chartTick = isDark ? '#94a3b8' : '#64748b';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">{t('loading_admin')}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: t('total_users'),
      value: stats?.usersCount ?? 0,
      sub: `${stats?.userDistribution?.customers ?? 0} ${t('dist_customers').toLowerCase()}`,
      icon: UsersIcon,
      stripe: 'bg-blue-500',
      iconWrap: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    },
    {
      label: t('total_orders'),
      value: stats?.ordersCount ?? 0,
      sub: `${stats?.weekOrders ?? 0} ${t('admin_this_week')}`,
      icon: ShoppingCart,
      stripe: 'bg-emerald-500',
      iconWrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
    {
      label: t('total_products'),
      value: stats?.productsCount ?? 0,
      sub: `${stats?.userDistribution?.vendors ?? 0} ${t('dist_vendors').toLowerCase()}`,
      icon: Package,
      stripe: 'bg-violet-500',
      iconWrap: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    },
    {
      label: t('revenue'),
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      sub: `₹${(stats?.weekRevenue ?? 0).toLocaleString()} ${t('admin_this_week')}`,
      icon: TrendingUp,
      stripe: 'bg-amber-500',
      iconWrap: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    },
  ];

  const userDistribution = stats?.userDistribution
    ? [
        { label: t('dist_customers'), count: stats.userDistribution.customers, color: 'bg-blue-500' },
        { label: t('dist_vendors'), count: stats.userDistribution.vendors, color: 'bg-emerald-500' },
        { label: t('dist_admins'), count: stats.userDistribution.admins, color: 'bg-violet-500' },
      ]
    : [];

  const totalRoleUsers = userDistribution.reduce((s, u) => s + u.count, 0) || 1;
  const platformGrowthData = stats?.platformGrowth ?? [];
  const recentOrders = stats?.recentOrders ?? [];
  const statusBreakdown = stats?.orderStatusBreakdown ?? {};

  const quickActions = [
    { id: 'users', label: t('user_management'), icon: UsersIcon, desc: t('admin_action_users') },
    { id: 'products', label: t('products'), icon: Package, desc: t('admin_action_products') },
    { id: 'orders', label: t('orders'), icon: ShoppingCart, desc: t('admin_action_orders') },
    { id: 'coupons', label: t('coupons'), icon: Tag, desc: t('admin_action_coupons') },
  ];

  const currentLangName = languages.find((l) => l.code === lang)?.name || lang.toUpperCase();

  const panelCard =
    'rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm dark:shadow-none';

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-[4.5rem]'
        } shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center font-black text-white shadow-md shadow-emerald-500/25">
              GC
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="font-black text-slate-900 dark:text-white truncate">{t('app_name')}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  {t('admin_console')}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-600/15 dark:text-emerald-300 dark:border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <item.icon
                  size={20}
                  className={active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}
                />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && item.id === 'queries' && (stats?.pendingQueries ?? 0) > 0 && (
                  <span className="ml-auto text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                    {stats.pendingQueries}
                  </span>
                )}
                {sidebarOpen && item.id === 'orders' && (stats?.pendingOrders ?? 0) > 0 && (
                  <span className="ml-auto text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                    {stats.pendingOrders}
                  </span>
                )}
                {sidebarOpen && item.id === 'vendors' && (insights?.notificationCounts?.pendingVendors ?? 0) > 0 && (
                  <span className="ml-auto text-[10px] font-black bg-violet-500 text-white px-1.5 py-0.5 rounded-full">
                    {insights.notificationCounts.pendingVendors}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('admin_role_badge')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between px-4 md:px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-black text-slate-900 dark:text-white truncate">
              {menuItems.find((m) => m.id === tab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold"
              >
                <Globe size={16} />
                <span className="hidden sm:inline">{currentLangName}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 py-1">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        lang === l.code
                          ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span className="hidden md:inline">{t('logout')}</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 bg-slate-50/80 dark:bg-slate-950">
          {tab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
              {/* Welcome strip */}
              <div className={`${panelCard} p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
                    {t('admin_welcome')}
                  </p>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                    {user?.name}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t('admin_welcome_sub')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-300 dark:border-slate-600 shrink-0"
                  onClick={() => fetchStats(true)}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {t('analytics_refresh')}
                </Button>
              </div>

              {/* KPI cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                  <Card
                    key={card.label}
                    className={`relative overflow-hidden p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.stripe}`} />
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          {card.label}
                        </p>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
                          {card.value}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.sub}</p>
                      </div>
                      <div className={`p-3 rounded-2xl ${card.iconWrap}`}>
                        <card.icon size={22} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Alerts */}
              {(stats?.pendingOrders > 0 ||
                stats?.pendingQueries > 0 ||
                (insights?.notificationCounts?.pendingVendors ?? 0) > 0) && (
                <div className="flex flex-wrap gap-3">
                  {stats.pendingOrders > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab('orders')}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 text-sm font-bold shadow-sm transition-colors"
                    >
                      <ClipboardList className="h-4 w-4" />
                      {stats.pendingOrders} {t('admin_pending_orders_cta')}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                  {stats.pendingQueries > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab('queries')}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2.5 text-sm font-bold shadow-sm transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {stats.pendingQueries} {t('admin_pending_queries_cta')}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                  {(insights?.notificationCounts?.pendingVendors ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab('vendors')}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-sm font-bold shadow-sm transition-colors"
                    >
                      <Store className="h-4 w-4" />
                      {insights.notificationCounts.pendingVendors} {t('admin_pending_vendors_cta')}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {insights && (
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className={`${panelCard} p-6 lg:col-span-2`}>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-600" />
                      {t('admin_activity_feed')}
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {(insights.activity || []).length === 0 ? (
                        <p className="text-sm text-slate-500">{t('admin_no_activity')}</p>
                      ) : (
                        insights.activity.map((a, i) => (
                          <div
                            key={`${a.type}-${a.id}-${i}`}
                            className="flex justify-between gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</p>
                              <p className="text-xs text-slate-500">{a.subtitle}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(a.at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className={`${panelCard} p-6`}>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                      <PackageX className="h-5 w-5 text-amber-600" />
                      {t('admin_inventory_alerts')}
                    </h3>
                    {(insights.inventoryAlerts || []).length === 0 ? (
                      <p className="text-sm text-slate-500">{t('admin_no_inventory_alerts')}</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {insights.inventoryAlerts.slice(0, 6).map((p) => (
                          <li key={p._id} className="text-slate-700 dark:text-slate-300">
                            <span className="font-bold">{p.name}</span>
                            <span className="text-xs text-rose-600 block">
                              {p.stock != null
                                ? `${t('stock')}: ${p.stock}`
                                : t('out_of_stock')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {insights && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className={`${panelCard} p-6`}>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      {t('admin_top_vendors')}
                    </h3>
                    {(insights.topVendors || []).map((v, i) => (
                      <div key={v.vendorId} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="font-semibold text-sm">
                          {i + 1}. {v.name}
                        </span>
                        <span className="text-sm font-bold text-emerald-600">₹{v.revenue?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`${panelCard} p-6`}>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-violet-500" />
                      {t('admin_top_products')}
                    </h3>
                    {(insights.topProducts || []).map((p, i) => (
                      <div key={p.productId} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="font-semibold text-sm">
                          {i + 1}. {p.name}
                        </span>
                        <span className="text-xs text-slate-500">{p.soldQty} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order status chips */}
              <div className={`${panelCard} p-4`}>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t('admin_order_pipeline')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusBreakdown).map(([status, count]) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setTab('orders')}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-90 ${
                        STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {tStatus(status) || status}
                      <span className="opacity-80">({count})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Chart */}
                <div className={`${panelCard} p-6 lg:col-span-2`}>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <TrendingUp className="text-emerald-600 dark:text-emerald-400 h-5 w-5" />
                    {t('platform_growth')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('admin_growth_sub')}</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={platformGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: chartTick, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="revenue"
                          tick={{ fill: chartTick, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `₹${v}`}
                          width={52}
                        />
                        <YAxis
                          yAxisId="orders"
                          orientation="right"
                          allowDecimals={false}
                          tick={{ fill: chartTick, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={28}
                        />
                        <Tooltip content={<AdminChartTooltip theme={theme} t={t} />} />
                        <Bar
                          yAxisId="revenue"
                          dataKey="revenue"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                          barSize={28}
                        />
                        <Line
                          yAxisId="orders"
                          type="monotone"
                          dataKey="orders"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* User distribution */}
                <div className={`${panelCard} p-6`}>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">
                    {t('user_distribution')}
                  </h3>
                  <div className="space-y-5">
                    {userDistribution.map((item) => {
                      const pct = Math.round((item.count / totalRoleUsers) * 100);
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.label}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              {item.count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${item.color} transition-all duration-700`}
                              style={{ width: `${Math.max(pct, item.count > 0 ? 6 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
                    <span className="text-slate-500">{t('total_users')}</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {stats?.usersCount ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent orders + quick actions */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className={`${panelCard} p-6 lg:col-span-2`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {t('admin_recent_orders')}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700 dark:text-emerald-400"
                      onClick={() => setTab('orders')}
                    >
                      {t('view_all')} <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  {recentOrders.length === 0 ? (
                    <p className="text-sm text-slate-500 py-8 text-center">{t('admin_no_recent_orders')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <th className="pb-3 font-bold">{t('table_order_id')}</th>
                            <th className="pb-3 font-bold">{t('table_customer')}</th>
                            <th className="pb-3 font-bold">{t('table_status')}</th>
                            <th className="pb-3 font-bold text-right">{t('table_amount')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr
                              key={order._id}
                              className="border-b border-slate-100 dark:border-slate-800/80 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            >
                              <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                                #{String(order._id).slice(-6).toUpperCase()}
                              </td>
                              <td className="py-3 text-slate-700 dark:text-slate-300">
                                {order.customerName}
                              </td>
                              <td className="py-3">
                                <span
                                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${
                                    STATUS_STYLES[order.status] ||
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800'
                                  }`}
                                >
                                  {tStatus(order.status) || order.status}
                                </span>
                              </td>
                              <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                                ₹{(order.totalPrice || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1">
                    {t('admin_quick_actions')}
                  </p>
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => setTab(action.id)}
                      className={`${panelCard} w-full p-4 text-left hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors group`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                          <action.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white">{action.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {action.desc}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                      </div>
                    </button>
                  ))}
                  <div className={`${panelCard} p-4 flex items-start gap-3`}>
                    <Store className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t('admin_platform_tip')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab !== 'overview' && (
            <div className={`${panelCard} p-4 md:p-6 max-w-7xl mx-auto animate-in fade-in duration-300`}>
              {tab === 'users' && <AdminUsers />}
              {tab === 'products' && <AdminProducts />}
              {tab === 'orders' && <AdminOrders />}
              {tab === 'coupons' && <AdminCoupons />}
              {tab === 'queries' && <AdminQueries />}
              {tab === 'vendors' && <AdminVendors />}
              {tab === 'notifications' && <AdminNotifications onNavigateTab={setTab} />}
              {tab === 'refunds' && <AdminRefunds />}
              {tab === 'reports' && <AdminReports />}
              {tab === 'reviews' && <AdminReviews />}
              {tab === 'logs' && <AdminLogs />}
              {tab === 'broadcast' && <AdminBroadcast />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
