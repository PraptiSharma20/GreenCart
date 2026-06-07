import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Percent, IndianRupee, Calendar, Store } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useLang } from '../context/language';

export function AdminCoupons() {
  const { t } = useLang();
  const [coupons, setCoupons] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = async () => {
    try {
      const [data, stats] = await Promise.all([
        api.coupons.getAll(),
        api.admin.getCouponAnalytics(),
      ]);
      setCoupons(data);
      setAnalytics(stats);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error(t('err_load_coupons'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.coupons.approve(id);
      toast.success(t('err_coupon_approved'));
      fetchCoupons();
    } catch (error) {
      console.error("Failed to approve coupon:", error);
      toast.error(t('err_coupon_approve_fail'));
    }
  };

  const handleDisable = async (id) => {
    try {
      await api.coupons.disable(id);
      toast.success(t('err_coupon_disabled'));
      fetchCoupons();
    } catch (error) {
      console.error("Failed to disable coupon:", error);
      toast.error(t('err_coupon_disable_fail'));
    }
  };

  const statusLabel = (status) => {
    if (status === 'active') return t('coupon_active');
    if (status === 'pending') return t('coupon_pending');
    if (status === 'disabled') return t('coupon_disabled');
    return status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'disabled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return CheckCircle2;
      case 'pending':
        return AlertCircle;
      case 'disabled':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {analytics && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: t('coupon_analytics_total'), value: analytics.total },
            { label: t('coupon_active'), value: analytics.active },
            { label: t('coupon_pending'), value: analytics.pending },
            { label: t('coupon_disabled'), value: analytics.disabled },
            { label: t('coupon_redemptions'), value: analytics.totalRedemptions },
          ].map((item) => (
            <Card key={item.label} className="p-4 rounded-2xl border-none shadow-sm">
              <p className="text-[10px] font-bold uppercase text-gray-500">{item.label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{item.value}</p>
            </Card>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('admin_coupons_title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('vendor_coupons_sub')}</p>
        </div>
      </div>

      {coupons.length === 0 ? (
        <Card className="p-12 border-none dark:bg-gray-800 shadow-sm text-center">
          <Percent size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('no_coupons_admin')}</h3>
          <p className="text-gray-500 dark:text-gray-400">{t('no_coupons_desc')}</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => {
            const StatusIcon = getStatusIcon(coupon.status);
            return (
              <Card key={coupon._id} className="p-6 border-none dark:bg-gray-800 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    {coupon.discountType === 'percentage' ? (
                      <Percent size={24} className="text-green-600 dark:text-green-400" />
                    ) : (
                      <IndianRupee size={24} className="text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <Badge className={`${getStatusColor(coupon.status)} text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5`}>
                    <StatusIcon size={12} />
                    {statusLabel(coupon.status)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {coupon.code}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {coupon.discountType === 'percentage' ? (
                      <span className="font-bold text-gray-900 dark:text-white">{coupon.discountValue}% OFF</span>
                    ) : (
                      <span className="font-bold text-gray-900 dark:text-white">₹{coupon.discountValue} OFF</span>
                    )}
                    {coupon.type === 'product' && coupon.productId && (
                      <span className="ml-2">{coupon.productId.name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <Store size={14} />
                    <span>{coupon.vendorId?.storeName || coupon.vendorId?.name || t('role_vendor')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <Calendar size={14} />
                    <span>
                      {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}
                    </span>
                  </div>

                  {coupon.minPurchase > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('min_order')}: ₹{coupon.minPurchase}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  {coupon.status === 'pending' && (
                    <Button
                      onClick={() => handleApprove(coupon._id)}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold"
                    >
                      <CheckCircle2 size={16} /> {t('approve')}
                    </Button>
                  )}
                  {coupon.status === 'active' && (
                    <Button
                      onClick={() => handleDisable(coupon._id)}
                      className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold"
                    >
                      <XCircle size={16} /> {t('disable')}
                    </Button>
                  )}
                  {coupon.status === 'disabled' && (
                    <Button
                      onClick={() => handleApprove(coupon._id)}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold"
                    >
                      <CheckCircle2 size={16} /> {t('approve')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
