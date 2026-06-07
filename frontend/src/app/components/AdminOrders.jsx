import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Loader2,
  ShoppingBag,
  Calendar,
  User,
  MapPin,
  Phone,
  CreditCard,
  Store,
  RefreshCw,
  Info,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/language';
import { getOrderCancellationSource } from '../utils/orderCancellationUtils';

const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Preparing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  Shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Out for Delivery': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  Delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  Refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Return Requested': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
};

function getOrderVendors(order) {
  const seen = new Map();
  for (const item of order.items || []) {
    const v = item.vendor;
    if (!v) continue;
    const id = typeof v === 'object' ? v._id : v;
    if (!id || seen.has(String(id))) continue;
    seen.set(String(id), typeof v === 'object' ? v : { _id: id, name: '—' });
  }
  return [...seen.values()];
}

export function AdminOrders() {
  const { t, tStatus } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await api.admin.getOrders();
      setOrders(data);
    } catch {
      toast.error(t('err_load_orders'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('platform_orders')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Info size={14} className="shrink-0" />
            {t('admin_orders_vendor_status_hint')}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('analytics_refresh')}
        </Button>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card className="p-10 text-center text-slate-500 rounded-2xl">{t('admin_no_orders')}</Card>
        ) : (
          orders.map((order) => {
            const vendors = getOrderVendors(order);
            const cancelSource = getOrderCancellationSource(order);

            return (
              <Card
                key={order._id}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t('table_order_id')}:
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        #{order._id.toString().slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(order.createdAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={12} /> {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-bold ${
                        STATUS_STYLES[order.status] ||
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {tStatus(order.status) || order.status}
                    </span>
                    {cancelSource && (
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {cancelSource === 'customer'
                          ? t('order_cancelled_by_customer_short')
                          : cancelSource === 'vendor'
                            ? t('order_cancelled_by_vendor_short')
                            : t('order_cancelled_by_system_short')}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[200px] text-right">
                      {t('admin_status_set_by_vendor')}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <User size={14} /> {t('customer_label')}
                    </h4>
                    <div className="text-sm">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {order.user?.name || t('guest_customer')}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">{order.user?.email || '—'}</p>
                      <p className="flex items-center gap-1 mt-1 text-slate-600 dark:text-slate-300">
                        <Phone size={12} /> {order.phoneNumber || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Store size={14} /> {t('order_vendor_info')}
                    </h4>
                    {vendors.length === 0 ? (
                      <p className="text-sm text-slate-500">{t('vendor_unknown')}</p>
                    ) : (
                      <div className="space-y-3">
                        {vendors.map((v) => (
                          <div
                            key={v._id}
                            className="text-sm rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-700"
                          >
                            <p className="font-bold text-slate-900 dark:text-white">
                              {v.storeName || v.name}
                            </p>
                            {v.storeName && v.name && (
                              <p className="text-slate-500 dark:text-slate-400 text-xs">{v.name}</p>
                            )}
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 break-all">
                              {v.email || '—'}
                            </p>
                            {v.phoneNumber && (
                              <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 mt-1">
                                <Phone size={11} /> {v.phoneNumber}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Truck size={14} /> {t('delivery_partner_label')}
                    </h4>
                    {order.deliveryAssignment?.partnerName ? (
                      <div className="text-sm rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-2.5 border border-indigo-100 dark:border-indigo-800">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {order.deliveryAssignment.partnerName}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 break-all">
                          {order.deliveryAssignment.partnerEmail || '—'}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 mt-1">
                          <Phone size={11} /> {order.deliveryAssignment.partnerPhone}
                        </p>
                        {order.deliveryAssignment.partnerReportedAt && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2">
                            {t('delivery_partner_confirmed_short')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">{t('delivery_partner_not_assigned')}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <MapPin size={14} /> {t('shipping')}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {order.shippingAddress}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <ShoppingBag size={14} /> {t('items')} ({order.items.length})
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item, i) => {
                        const vendorLabel =
                          item.vendor?.storeName ||
                          item.vendor?.name ||
                          t('vendor_unknown');
                        return (
                          <div key={i} className="text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-700 dark:text-slate-200 truncate">
                                {item.product?.name || t('deleted_product')} × {item.quantity}
                              </span>
                              <span className="font-bold whitespace-nowrap text-slate-900 dark:text-white">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                              {t('fulfilled_by')}: {vendorLabel}
                            </p>
                          </div>
                        );
                      })}
                      <div className="pt-2 flex justify-between items-center font-bold text-slate-900 dark:text-white">
                        <span>{t('total_amount')}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                          ₹{order.totalPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
