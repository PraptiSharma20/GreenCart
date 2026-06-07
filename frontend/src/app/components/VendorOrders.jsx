import { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { useLang } from '../context/language';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Package, User, MapPin, Phone, Calendar, Search, ArrowUpRight, Clock, CheckCircle2, AlertCircle, ShoppingBag, RotateCcw, CreditCard, Banknote, Tag, ChevronDown, IndianRupee, Truck } from 'lucide-react';
import { AssignDeliveryModal } from './AssignDeliveryModal';
import { VendorRefundBlockedModal } from './VendorRefundModal';
import { ConfirmDialog } from './ui/confirm-dialog';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  getVendorSelectableStatuses,
  isValidVendorStatusTransition,
  isVendorStatusLocked,
  isDeliveryPartnerConfirmed,
} from '../utils/vendorOrderStatus';
import {
  canVendorProcessOnlineRefund,
  getPaymentLabelKey,
  isOnlinePayment,
  shouldShowVendorRefundButton,
} from '../utils/vendorRefundUtils';
import {
  getOrderCancellationSource,
  getVendorCancellationDisplay,
} from '../utils/orderCancellationUtils';

function VendorOrderStatusControl({
  order,
  orderStatuses,
  updating,
  onStatusChange,
  t,
  tStatus,
  statusInfo,
  statusLabel,
  statusBadgeClass,
}) {
  const locked = isVendorStatusLocked(order.status);
  const isUpdating = updating === order._id;

  if (locked) {
    return (
      <Badge className={`${statusBadgeClass} border border-gray-200 dark:border-gray-600 shadow-sm py-2 px-3 flex items-center gap-2 min-w-[10rem] justify-center`}>
        <statusInfo.icon size={14} className="shrink-0" />
        <span className="text-sm font-bold leading-tight">{statusLabel}</span>
      </Badge>
    );
  }

  return (
    <div className="relative shrink-0">
      <select
        className="min-w-[11rem] bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 rounded-xl pl-3 pr-10 py-2.5 text-sm font-bold text-gray-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:opacity-60 shadow-sm"
        value={order.status}
        onChange={(e) => onStatusChange(order, e.target.value)}
        disabled={isUpdating}
        aria-label={t('vendor_update_status')}
        title={t('vendor_update_status_hint')}
      >
        {getVendorSelectableStatuses(order.status, order).map((statusValue) => {
          const meta = orderStatuses.find((s) => s.value === statusValue);
          return (
            <option key={statusValue} value={statusValue} className="dark:bg-gray-800">
              {meta?.label ?? tStatus(statusValue)}
            </option>
          );
        })}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-300"
        size={18}
        strokeWidth={2.5}
      />
      {isUpdating && (
        <Loader2
          className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-green-600"
          size={16}
        />
      )}
    </div>
  );
}

const ORDER_STATUS_CONFIG = [
  { value: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  { value: 'Accepted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  { value: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: ArrowUpRight },
  { value: 'Delivered', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  { value: 'Return Requested', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: RotateCcw },
  { value: 'Cancelled', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: AlertCircle },
  { value: 'Refunded', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: AlertCircle },
];

export function VendorOrders() {
  const { t, tStatus } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [refundConfirmOrder, setRefundConfirmOrder] = useState(null);
  const [approveReturnConfirmOrder, setApproveReturnConfirmOrder] = useState(null);
  const [refundBlockedOrder, setRefundBlockedOrder] = useState(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);

  const orderStatuses = useMemo(
    () => ORDER_STATUS_CONFIG.map((s) => ({ ...s, label: tStatus(s.value) })),
    [tStatus]
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await api.vendor.getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error(t('err_load_orders'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (order, newStatus) => {
    const orderId = order._id;
    const currentStatus = order.status;

    if (newStatus === currentStatus) return;

    if (!isValidVendorStatusTransition(currentStatus, newStatus)) {
      toast.error(t('err_invalid_status_transition'));
      return;
    }

    if (newStatus === 'Out for Delivery' && currentStatus !== 'Out for Delivery') {
      setDispatchModalOrder(order);
      return;
    }

    setUpdating(orderId);
    try {
      await api.vendor.updateOrderStatus(orderId, newStatus);
      toast.success(t('err_order_status_updated'));
      fetchOrders();
    } catch (error) {
      toast.error(error.message || t('err_update_status'));
    } finally {
      setUpdating(null);
    }
  };

  const getOrderTotal = (order) =>
    order.vendorSubtotal ?? order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) ?? 0;

  const getPaymentStatusLabel = (status) => {
    const key = `payment_status_${(status || 'pending').toLowerCase()}`;
    return t(key) || status || 'Pending';
  };

  const handleConfirmPartnerDelivery = async (order) => {
    const orderId = order._id;
    setUpdating(orderId);
    try {
      await api.vendor.confirmPartnerDelivery(orderId);
      toast.success(t('delivery_partner_confirmed'));
      fetchOrders();
    } catch (error) {
      toast.error(error.message || t('err_confirm_delivery'));
    } finally {
      setUpdating(null);
    }
  };

  const handleRefundClick = (order) => {
    const { allowed, reasonKey } = canVendorProcessOnlineRefund(order);
    if (!allowed) {
      setRefundBlockedOrder({ order, reasonKey });
      return;
    }
    setRefundConfirmOrder(order);
  };

  const handleRefund = async () => {
    if (!refundConfirmOrder) return;
    const orderId = refundConfirmOrder._id;
    setUpdating(orderId);
    try {
      await api.vendor.refundOrder(orderId);
      toast.success(t('err_refund_success'));
      setRefundConfirmOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.message || t('err_refund_fail'));
    } finally {
      setUpdating(null);
    }
  };

  const handleApproveReturn = async () => {
    if (!approveReturnConfirmOrder) return;
    const orderId = approveReturnConfirmOrder._id;
    setUpdating(orderId);
    try {
      await api.vendor.approveReturn(orderId);
      toast.success(t('vendor_return_approved'));
      setApproveReturnConfirmOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.message || t('err_refund_fail'));
    } finally {
      setUpdating(null);
    }
  };

  const orderShortId = (order) =>
    (order?._id || order?.id)?.toString()?.slice(-6).toUpperCase() || '';

  const refundConfirmDetail = (order) => {
    if (!order) return null;
    const amount = order.totalPrice ?? getOrderTotal(order);
    const sub = order.actionDetails?.reasonLabel
      ? `${t('refund_modal_reason')}: ${order.actionDetails.reasonLabel}`
      : `${t('vendor_payment_mode')}: ${t(getPaymentLabelKey(order.paymentMethod))}`;
    return {
      label: t('refund_modal_amount'),
      value: `₹${amount.toLocaleString()} · #${orderShortId(order)}`,
      sub,
    };
  };

  const filteredOrders = orders.filter(order => {
    const orderId = (order._id || order.id)?.toString() || '';
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchesSearch = orderId.includes(searchTerm) || 
                          order.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 space-y-4">
      <Loader2 className="animate-spin text-green-600 h-10 w-10" />
      <p className="text-gray-500 font-medium">{t('fetching_orders')}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-100 dark:shadow-none">
            <ShoppingBag size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{t('manage_orders')}</h2>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-none font-black text-xs px-2 py-0.5 rounded-lg">
                {filteredOrders.length} {filterStatus !== 'All' ? tStatus(filterStatus) : ''} {t('orders_count_suffix')}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">{t('vendor_orders_sub')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
          {['All', 'Pending', 'Accepted', 'Out for Delivery', 'Delivered', 'Return Requested', 'Cancelled', 'Refunded'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
                filterStatus === s 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-100 dark:shadow-none scale-105' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {s === 'All' ? t('filter_all_option') : tStatus(s)}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-4 border-none shadow-sm bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={t('search_orders')} 
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white dark:placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {filteredOrders.length === 0 ? (
        <Card className="p-24 text-center border-none shadow-xl bg-white dark:bg-gray-800 transition-all duration-500">
          <div className="w-32 h-32 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300">
            <Package size={48} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('no_orders_yet')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">{t('no_recent_orders_desc')}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const statusInfo = orderStatuses.find(s => s.value === order.status) || orderStatuses[0];
            const cancelSource = getOrderCancellationSource(order);
            const cancelDisplay = cancelSource
              ? getVendorCancellationDisplay(cancelSource, t)
              : null;
            const sidebarBg =
              cancelDisplay?.sidebarClass ??
              (statusInfo.value === 'Pending'
                ? 'bg-amber-500'
                : statusInfo.value === 'Accepted'
                  ? 'bg-blue-500'
                  : statusInfo.value === 'Out for Delivery'
                    ? 'bg-indigo-500'
                    : statusInfo.value === 'Delivered'
                      ? 'bg-emerald-500'
                      : statusInfo.value === 'Return Requested'
                        ? 'bg-orange-500'
                        : statusInfo.value === 'Refunded'
                          ? 'bg-purple-500'
                          : 'bg-rose-500');
            const statusLabel = cancelDisplay?.label ?? statusInfo.label ?? order.status;
            const statusBadgeClass = cancelDisplay?.badgeClass ?? statusInfo.color;

            return (
              <Card key={order._id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group dark:bg-gray-800">
                <div className="flex flex-col lg:flex-row">
                  {/* Order ID & Status Sidebar */}
                  <div className={`w-full lg:w-64 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/20 transition-colors duration-300 ${sidebarBg}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-2 opacity-70">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Order ID</span>
                      </div>
                      <h3 className="font-mono font-black text-xl mb-4 text-white">#{(order._id || order.id)?.toString()?.slice(-6).toUpperCase() || 'N/A'}</h3>
                      <Badge className={`${statusBadgeClass} border-none shadow-sm py-1.5 px-3 flex items-center gap-2 w-fit max-w-full`}>
                        <statusInfo.icon size={14} className="shrink-0" />
                        <span className="text-left leading-tight">{statusLabel}</span>
                      </Badge>
                      {cancelDisplay?.hint && (
                        <p className="text-[11px] text-white/80 mt-2 leading-snug">{cancelDisplay.hint}</p>
                      )}
                    </div>
                    <div className="mt-8 lg:mt-0 flex items-center gap-2 text-xs font-bold opacity-70 text-white">
                      <Calendar size={14} />
                      {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 p-8 grid md:grid-cols-2 gap-12 bg-white dark:bg-gray-800 transition-colors duration-300">
                    {/* Customer Info */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors duration-300">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Customer</p>
                          <p className="font-black text-gray-900 dark:text-white">{order.user?.name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 ml-1">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors duration-300">
                            <Phone size={14} />
                          </div>
                          <span className="font-medium">{order.phoneNumber}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 transition-colors duration-300">
                            <MapPin size={14} />
                          </div>
                          <span className="font-medium leading-relaxed">{order.shippingAddress}</span>
                        </div>
                      </div>

                      {order.deliveryAssignment?.partnerName && (
                        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Truck size={12} /> {t('delivery_partner_assigned')}
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">{order.deliveryAssignment.partnerName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <Phone size={12} /> {order.deliveryAssignment.partnerPhone}
                          </p>
                          {order.deliveryAssignment.partnerEmail && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{order.deliveryAssignment.partnerEmail}</p>
                          )}
                          {order.status === 'Out for Delivery' && (
                            <p className={`text-xs font-semibold mt-1 ${isDeliveryPartnerConfirmed(order) ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {isDeliveryPartnerConfirmed(order)
                                ? t('delivery_partner_confirmed_at')
                                : t('delivery_partner_awaiting_confirm')}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600 p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          {t('vendor_order_details')}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-start gap-2">
                            {isOnlinePayment(order.paymentMethod) ? (
                              <CreditCard size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                            ) : (
                              <Banknote size={16} className="text-amber-500 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('vendor_payment_mode')}</p>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {t(getPaymentLabelKey(order.paymentMethod))}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <IndianRupee size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('vendor_payment_status')}</p>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {getPaymentStatusLabel(order.paymentStatus)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Package size={16} className="text-green-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('vendor_order_total')}</p>
                              <p className="font-bold text-gray-900 dark:text-white">
                                ₹{(order.totalPrice ?? getOrderTotal(order)).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {order.couponCode && (
                            <div className="flex items-start gap-2">
                              <Tag size={16} className="text-purple-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('vendor_coupon_applied')}</p>
                                <p className="font-bold text-gray-900 dark:text-white">{order.couponCode}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Order Summary</p>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center group/item">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xs font-black text-gray-400 dark:text-gray-500 group-hover/item:bg-green-50 dark:group-hover/item:bg-green-900/20 group-hover/item:text-green-600 dark:group-hover/item:text-green-400 transition-colors duration-300">
                                {item.quantity}x
                              </div>
                              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors duration-300">{item.product?.name}</span>
                            </div>
                            <span className="text-sm font-black text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {order.actionDetails?.actionType === 'cancel' && cancelSource === 'customer' && (
                        <div
                          className={
                            cancelDisplay?.reasonBoxClass ??
                            'rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-600 p-4 text-sm'
                          }
                        >
                          <p
                            className={`font-bold mb-1 ${cancelDisplay?.reasonTitleClass ?? 'text-slate-800 dark:text-slate-200'}`}
                          >
                            {t('vendor_customer_cancel_reason')}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>{order.actionDetails.reasonLabel}</strong>
                          </p>
                          {order.actionDetails.additionalComments && (
                            <p className="text-gray-600 dark:text-gray-400 mt-1 italic">
                              &ldquo;{order.actionDetails.additionalComments}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                      {order.actionDetails?.actionType === 'return' && (
                        <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 text-sm">
                          <p className="font-bold text-orange-800 dark:text-orange-300 mb-1">
                            {t('vendor_return_reason')}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>{order.actionDetails.reasonLabel}</strong>
                          </p>
                          {order.actionDetails.additionalComments && (
                            <p className="text-gray-600 dark:text-gray-400 mt-1 italic">
                              &ldquo;{order.actionDetails.additionalComments}&rdquo;
                            </p>
                          )}
                          {(order.actionDetails.questionnaire || []).map((q, i) => (
                            <p key={i} className="text-xs text-gray-500 mt-1">
                              {q.question}:{' '}
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {q.answer}
                              </span>
                            </p>
                          ))}
                        </div>
                      )}
                      
                      <div className="pt-6 border-t border-gray-50 dark:border-gray-700 flex flex-wrap justify-between items-end gap-4 transition-colors duration-300">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Revenue</span>
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            ₹{getOrderTotal(order).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-end gap-2 justify-end">
                          <VendorOrderStatusControl
                            order={order}
                            orderStatuses={orderStatuses}
                            updating={updating}
                            onStatusChange={handleStatusUpdate}
                            t={t}
                            tStatus={tStatus}
                            statusInfo={statusInfo}
                            statusLabel={statusLabel}
                            statusBadgeClass={statusBadgeClass}
                          />
                          {order.status === 'Out for Delivery' && !isDeliveryPartnerConfirmed(order) && (
                            <button
                              type="button"
                              onClick={() => handleConfirmPartnerDelivery(order)}
                              disabled={updating === order._id}
                              className="px-4 py-2 text-xs font-black rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {updating === order._id && <Loader2 size={14} className="animate-spin" />}
                              <Truck size={14} />
                              {t('delivery_partner_confirm_btn')}
                            </button>
                          )}
                          {order.status === 'Return Requested' && (
                            <button
                              type="button"
                              onClick={() => setApproveReturnConfirmOrder(order)}
                              disabled={updating === order._id}
                              className="px-4 py-2 text-xs font-black rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {updating === order._id && <Loader2 size={14} className="animate-spin" />}
                              {t('vendor_approve_return')}
                            </button>
                          )}
                          {shouldShowVendorRefundButton(order) && (
                            <button
                              type="button"
                              onClick={() => handleRefundClick(order)}
                              disabled={updating === order._id}
                              className="px-4 py-2 text-xs font-black rounded-xl transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {updating === order._id && <Loader2 size={14} className="animate-spin" />}
                              Refund
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <VendorRefundBlockedModal
        blocked={refundBlockedOrder}
        onClose={() => setRefundBlockedOrder(null)}
        t={t}
      />

      <ConfirmDialog
        isOpen={!!refundConfirmOrder}
        onClose={() => setRefundConfirmOrder(null)}
        onConfirm={handleRefund}
        closeOnConfirm={false}
        isLoading={updating === refundConfirmOrder?._id}
        title={t('refund_confirm_title')}
        message={t('refund_confirm_warning')}
        detail={refundConfirmDetail(refundConfirmOrder)}
        confirmText={t('refund_confirm_btn')}
        cancelText={t('btn_cancel')}
        variant="purple"
        icon={<RefreshCcw className="h-9 w-9 text-purple-600 dark:text-purple-400" strokeWidth={2.25} />}
      />

      <AssignDeliveryModal
        order={dispatchModalOrder}
        isOpen={!!dispatchModalOrder}
        onClose={() => setDispatchModalOrder(null)}
        onSuccess={() => {
          toast.success(t('dispatch_success'));
          fetchOrders();
        }}
      />

      <ConfirmDialog
        isOpen={!!approveReturnConfirmOrder}
        onClose={() => setApproveReturnConfirmOrder(null)}
        onConfirm={handleApproveReturn}
        closeOnConfirm={false}
        isLoading={updating === approveReturnConfirmOrder?._id}
        title={t('refund_confirm_title')}
        message={t('approve_return_confirm_message')}
        detail={refundConfirmDetail(approveReturnConfirmOrder)}
        confirmText={t('refund_confirm_btn')}
        cancelText={t('btn_cancel')}
        variant="purple"
        icon={<RefreshCcw className="h-9 w-9 text-purple-600 dark:text-purple-400" strokeWidth={2.25} />}
      />
    </div>
  );
}
