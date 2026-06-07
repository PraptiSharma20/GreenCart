import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useOrders } from '../context/orders';
import { useLang } from '../context/language';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ShoppingBag, MapPin, Truck, CheckCircle, Clock, Package, Search, XCircle, RotateCcw } from "lucide-react";
import { useReviewPrompt } from '../context/ReviewPromptContext';
import { OrderDeliveredPanel } from '../components/OrderDeliveredPanel';
import { OrderActionModal } from '../components/OrderActionModal';
import { OrderReviewFormModal } from '../components/OrderReviewFormModal';
import { api } from '../../lib/api';
import { OrderRefundBanner, OrderItemRefundLine } from '../components/OrderRefundBanner';
import {
  canCancelOrder,
  canReturnOrder,
  isReturnPending,
  showRefundUi,
  isOrderDelivered,
} from '../utils/orderActionUtils';
import { getOrderStatusBadgeForClient } from '../utils/orderCancellationUtils';
import { toast } from 'sonner';

export function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedRef = useRef(null);
  const { orders, updateOrderStatus, refreshOrders, cancelOrder, returnOrder } = useOrders();
  const { t, lang } = useLang();
  const { refreshPending } = useReviewPrompt();
  const [trackId, setTrackId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModal, setActionModal] = useState({ open: false, type: null, order: null });
  const [reviewModal, setReviewModal] = useState({
    open: false,
    orderId: null,
    orderShortId: '',
    productId: null,
    productName: '',
    productImage: '',
    rating: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role !== 'vendor') {
      refreshOrders();
      refreshPending();
    }
  }, [user, refreshOrders, refreshPending]);

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (!highlight || !orders.length) return;
    const match = orders.find(
      (o) => String(o._id || o.id) === String(highlight)
    );
    if (match) {
      setTrackId(match._id || match.id);
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [searchParams, orders]);

  const handleItemRated = () => {
    refreshOrders();
    refreshPending();
  };

  const handleReviewSubmit = async (payload) => {
    try {
      await api.products.rate(
        payload.productId,
        payload.rating,
        payload.comment,
        payload.orderId,
        payload.surveyAnswers
      );
      toast.success(t('review_submit_success'));
      handleItemRated();
      setReviewModal({
        open: false,
        orderId: null,
        orderShortId: '',
        productId: null,
        productName: '',
        productImage: '',
        rating: 0,
      });
    } catch (err) {
      toast.error(err.message || t('review_submit_error'));
      throw err;
    }
  };

  const handleDeliveredStarClick = ({ order, item, productId, productName, productImage, rating }) => {
    const orderId = order._id || order.id;
    setReviewModal({
      open: true,
      orderId,
      orderShortId: String(orderId).slice(-6).toUpperCase(),
      productId,
      productName,
      productImage,
      rating,
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500';
      case 'out for delivery':
        return 'bg-orange-500';
      case 'shipped':
        return 'bg-blue-500';
      case 'preparing':
        return 'bg-purple-500';
      case 'accepted':
        return 'bg-teal-500';
      case 'pending':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'out for delivery':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'preparing':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'accepted':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'return requested':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'refunded':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleActionSubmit = async (payload) => {
    const orderId = actionModal.order._id || actionModal.order.id;
    try {
      if (actionModal.type === 'return' && !canReturnOrder(actionModal.order)) {
        toast.error(t('return_window_closed'));
        setActionModal({ open: false, type: null, order: null });
        return;
      }
      if (actionModal.type === 'cancel') {
        await cancelOrder(orderId, payload);
        toast.success(t('action_cancel_success'));
      } else {
        await returnOrder(orderId, payload);
        toast.success(t('action_return_success'));
      }
      setActionModal({ open: false, type: null, order: null });
      refreshPending();
    } catch (err) {
      toast.error(err.message || t('action_submit_error'));
      throw err;
    }
  };

  const orderStatuses = [
    { label: 'Pending', value: 'Pending', icon: Clock },
    { label: 'Accepted', value: 'Accepted', icon: CheckCircle },
    { label: 'Out for Delivery', value: 'Out for Delivery', icon: Truck },
    { label: 'Delivered', value: 'Delivered', icon: CheckCircle },
  ];

  const getTrackingStepIndex = (status) => {
    const normalized = { Preparing: 'Accepted', Shipped: 'Out for Delivery' }[status] || status;
    if (normalized === 'Cancelled' || normalized === 'Refunded' || normalized === 'Return Requested') {
      return -1;
    }
    return orderStatuses.findIndex((s) => s.value === normalized);
  };

  const getPlaceholderImage = () => {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400&auto=format&fit=crop';
  };

  if (!user) {
    return null;
  }

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search by order ID
    const orderIdMatch = (order._id || order.id || '').toLowerCase().includes(query);
    
    // Search by status
    const statusMatch = (order.status || '').toLowerCase().includes(query);
    
    // Search by customer name (for vendors)
    const customerNameMatch = user?.role === 'vendor' && order.user?.name 
      ? order.user.name.toLowerCase().includes(query) 
      : false;
      
    // Search by customer email (for vendors)
    const customerEmailMatch = user?.role === 'vendor' && order.user?.email 
      ? order.user.email.toLowerCase().includes(query) 
      : false;
      
    // Search by item names
    const itemNameMatch = order.items?.some((item) => 
      (item.product?.name || '').toLowerCase().includes(query)
    );
    
    return orderIdMatch || statusMatch || customerNameMatch || customerEmailMatch || itemNameMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-10 w-10 text-green-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              {user?.role === 'vendor' ? t('manage_orders') || 'Manage Client Orders' : t('orders_title') || 'My Orders'}
            </h1>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-1/3 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                user?.role === 'vendor' 
                  ? 'Search by Order ID, Customer Name, Status, Items...'
                  : 'Search by Order ID, Status, Items...'
              }
              className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-green-500 dark:focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-8 flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-green-100 to-emerald-100 shadow-lg dark:from-green-900/30 dark:to-emerald-900/30">
              {searchQuery ? (
                <Search className="h-20 w-20 text-gray-400" />
              ) : (
                <ShoppingBag className="h-20 w-20 text-green-500" />
              )}
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
              {searchQuery 
                ? 'No orders found for your search' 
                : (user?.role === 'vendor' ? 'No client orders yet' : t('no_orders') || 'No Orders Yet')}
            </h2>
            <p className="mb-10 max-w-lg text-gray-600 dark:text-gray-300 text-lg">
              {searchQuery 
                ? 'Try searching with different keywords or clear the search bar to see all orders.' 
                : (user?.role === 'vendor' 
                  ? 'When clients place orders for your products, they will appear here in style.' 
                  : t('no_orders_desc') || 'Start shopping to see your orders here!')}
            </p>
            {user?.role !== 'vendor' && !searchQuery && (
              <Button 
                size="lg" 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-7 text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                {t('shop_now') || 'Shop Now'}
              </Button>
            )}
            {searchQuery && (
              <Button 
                size="lg" 
                onClick={() => setSearchQuery('')}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-10 py-7 text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredOrders.map((order) => {
              const oid = order._id || order.id;
              const isHighlighted =
                searchParams.get('highlight') &&
                String(oid) === String(searchParams.get('highlight'));
              const statusBadge = getOrderStatusBadgeForClient(
                order,
                order.status,
                t,
                getStatusBadgeClass
              );
              return (
              <Card
                key={oid}
                ref={isHighlighted ? highlightedRef : undefined}
                className={`p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-800 ${
                  isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-gray-900' : ''
                }`}
              >
                {/* Order Header */}
                <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Package className="h-6 w-6 text-green-600" />
                        Order #{order._id ? order._id.slice(-6).toUpperCase() : order.id}
                      </h3>
                      <Badge className={`px-4 py-2 text-sm font-semibold rounded-full border ${statusBadge.badgeClass}`}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                    {statusBadge.hint && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 -mt-1">
                        {statusBadge.hint}
                        {statusBadge.cancelSource === 'customer' && order.actionDetails?.reasonLabel && (
                          <span className="block mt-0.5 text-gray-600 dark:text-gray-300">
                            {t('vendor_customer_cancel_reason')}: {order.actionDetails.reasonLabel}
                          </span>
                        )}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-300">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        Placed on {new Date(order.createdAt || order.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang === 'pa' ? 'pa-IN' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {user?.role === 'vendor' && order.user && (
                        <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          {order.user.name} ({order.user.email})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                      ₹{(order.totalPrice || order.total || 0).toFixed(2)}
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      {user?.role === 'vendor' ? (
                        <>
                          {order.status === 'Pending' && (
                            <Button size="sm" onClick={() => updateOrderStatus(order._id || order.id, 'Accepted')} className="bg-green-600 hover:bg-green-700 rounded-xl">
                              {t('accept_order') || 'Accept'}
                            </Button>
                          )}
                          {(order.status === 'Accepted' || order.status === 'Preparing') && (
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={() => updateOrderStatus(order._id || order.id, 'Out for Delivery')}>
                              {t('mark_out_for_delivery')}
                            </Button>
                          )}
                          {(order.status === 'Out for Delivery' || order.status === 'Shipped') && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-xl" onClick={() => updateOrderStatus(order._id || order.id, 'Delivered')}>
                              {t('mark_delivered')}
                            </Button>
                          )}
                          {['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Shipped'].includes(order.status) && (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 rounded-xl" onClick={() => updateOrderStatus(order._id || order.id, 'Cancelled')}>
                              {t('cancel_order')}
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          {canCancelOrder(order) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 gap-1"
                              onClick={() => setActionModal({ open: true, type: 'cancel', order })}
                            >
                              <XCircle className="h-4 w-4" />
                              {t('order_cancel_btn')}
                            </Button>
                          )}
                          {canReturnOrder(order) && !isOrderDelivered(order) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 gap-1"
                              onClick={() => setActionModal({ open: true, type: 'return', order })}
                            >
                              <RotateCcw className="h-4 w-4" />
                              {t('order_return_btn')}
                            </Button>
                          )}
                          {isReturnPending(order) && (
                            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 px-2">
                              {t('return_pending_vendor')}
                            </span>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setTrackId(trackId === (order._id || order.id) ? null : (order._id || order.id))}
                            className="rounded-xl border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
                          >
                            {trackId === (order._id || order.id) ? 'Hide Tracking' : 'Track Order'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {user?.role !== 'vendor' && isOrderDelivered(order) && (
                  <OrderDeliveredPanel
                    order={order}
                    user={user}
                    onReturnClick={() =>
                      setActionModal({ open: true, type: 'return', order })
                    }
                    onStarClick={handleDeliveredStarClick}
                  />
                )}

                {/* Order Tracking */}
                {trackId === (order._id || order.id) && user?.role !== 'vendor' && (
                  <div className="mb-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 border border-green-100 dark:border-green-800">
                    <h4 className="mb-8 font-bold text-xl text-gray-900 dark:text-white flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                      Live Order Tracking
                    </h4>
                    {getTrackingStepIndex(order.status) < 0 ? (
                      <p className="text-center text-sm font-semibold text-rose-600 dark:text-rose-400 py-4">
                        {t(order.status) || order.status}
                      </p>
                    ) : (
                    <div className="relative flex justify-between items-center">
                      {/* Progress Bar Background */}
                      <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      
                      {/* Active Progress Bar */}
                      <div 
                        className="absolute left-0 top-1/2 h-2 -translate-y-1/2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-in-out"
                        style={{ 
                          width: `${Math.max(0, (getTrackingStepIndex(order.status) / (orderStatuses.length - 1)) * 100)}%` 
                        }}
                      ></div>

                      {orderStatuses.map((step, idx) => {
                        const currentStepIndex = getTrackingStepIndex(order.status);
                        const isActive = currentStepIndex >= idx;
                        const isCurrent = order.status === step.value || (
                          { Preparing: 'Accepted', Shipped: 'Out for Delivery' }[order.status] === step.value
                        );
                        const Icon = step.icon;
                        
                        return (
                          <div key={step.value} className="relative z-10 flex flex-col items-center">
                            <div className={`flex h-14 w-14 items-center justify-center rounded-full border-4 transition-all duration-500 shadow-lg ${
                              isActive 
                                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 text-green-600 scale-110' 
                                : 'border-gray-200 bg-white dark:bg-gray-800 text-gray-400'
                            } ${isCurrent ? 'ring-8 ring-green-100 dark:ring-green-900/50' : ''}`}>
                              {isActive ? (
                                <Icon className="h-7 w-7" />
                              ) : (
                                <span className="text-lg font-bold">{idx + 1}</span>
                              )}
                            </div>
                            <p className={`mt-4 text-sm font-bold transition-colors duration-500 ${isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                )}

                {user?.role !== 'vendor' && showRefundUi(order) && (
                  <OrderRefundBanner order={order} />
                )}

                {/* Order Details */}
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Items Column */}
                  <div className="lg:col-span-2">
                    <h4 className="mb-6 font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-green-600" />
                      Order Items
                    </h4>
                    <div className="space-y-4">
                      {order.items?.map((item, idx) => {
                        let productImage;
                        let productName;

                        // Handle different possible product structures
                        if (item.product) {
                          if (typeof item.product === 'object') {
                            productImage = item.product.image;
                            productName = item.product.name;
                          } else if (item.image) {
                            // Fallback if product was stored as object with image/name directly on item
                            productImage = item.image;
                            productName = item.name;
                          }
                        }

                        // Use defaults if nothing found
                        productImage = productImage || getPlaceholderImage();
                        productName = productName || 'Product';

                        return (
                          <div key={idx} className="flex items-center gap-5 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 flex-shrink-0">
                              <img 
                                src={productImage} 
                                alt={productName} 
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = getPlaceholderImage();
                                }}
                                loading="lazy"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{productName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quantity: {item.quantity}</p>
                              {user?.role !== 'vendor' && showRefundUi(order) && (
                                <OrderItemRefundLine order={order} item={item} />
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xl font-bold text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">₹{item.price.toFixed(2)}/each</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Shipping Details */}
                  <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border border-green-100 dark:border-green-800">
                    <h4 className="mb-5 font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Shipping Details
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{order.shippingAddress}</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-gray-800/70">
                        <span className="font-semibold text-gray-900 dark:text-white min-w-[80px]">Payment:</span>
                        <span className="text-gray-700 dark:text-gray-300">{order.paymentMethod?.toUpperCase()}</span>
                      </div>
                      {order.phoneNumber && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-gray-800/70">
                          <span className="font-semibold text-gray-900 dark:text-white min-w-[80px]">Contact:</span>
                          <span className="text-gray-700 dark:text-gray-300">{order.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
            })}
          </div>
        )}
      </div>

      <OrderActionModal
        isOpen={actionModal.open}
        actionType={actionModal.type}
        order={actionModal.order}
        onClose={() => setActionModal({ open: false, type: null, order: null })}
        onSubmit={handleActionSubmit}
      />

      <OrderReviewFormModal
        key={`${reviewModal.productId}-${reviewModal.orderId}-${reviewModal.rating}`}
        isOpen={reviewModal.open}
        orderId={reviewModal.orderId}
        orderShortId={reviewModal.orderShortId}
        productId={reviewModal.productId}
        productName={reviewModal.productName}
        productImage={reviewModal.productImage}
        initialRating={reviewModal.rating}
        onClose={() =>
          setReviewModal({
            open: false,
            orderId: null,
            orderShortId: '',
            productId: null,
            productName: '',
            productImage: '',
            rating: 0,
          })
        }
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}
