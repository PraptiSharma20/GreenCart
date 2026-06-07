import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/language';
import { useAuth } from '../context/auth';
import { api } from '../../lib/api';
import { Loader2, Percent, IndianRupee, Calendar, Store, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function Offers() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const isVendor = user?.role === 'vendor';

  const fetchCoupons = async () => {
    try {
      let data;
      if (isVendor) {
        data = await api.coupons.getVendorCoupons();
      } else {
        data = await api.coupons.getActive();
      }
      setCoupons(data);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [user]);

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('offers_coupons')}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isVendor ? 'Manage your store coupons and offers' : 'Discover amazing discounts from our vendors'}
          </p>
        </div>
      </div>
      
      {coupons.length === 0 ? (
        <Card className="p-16 border-none dark:bg-gray-800 shadow-lg text-center rounded-3xl">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center mx-auto mb-6">
            <Percent size={48} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
            {isVendor ? 'No coupons yet' : 'No active offers right now'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {isVendor 
              ? 'Create your first coupon to start offering discounts to your customers!' 
              : 'Check back later for exciting discounts!'}
          </p>
          {isVendor && (
            <Button
              onClick={() => navigate('/vendor/dashboard')}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus size={18} /> Go to Dashboard
            </Button>
          )}
        </Card>
      ) : (
        <>
          {!isVendor && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 -mt-2">
              {t('offers_available_count').replace('{count}', String(coupons.length))}
            </p>
          )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <Card key={coupon._id} className="p-0 overflow-hidden border-none dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl">
              {/* Coupon Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-3xl font-black">{coupon.code}</span>
                  <div className="flex flex-col items-end gap-1">
                  {coupon.type === 'product' ? (
                    <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                      {t('product_coupon')}
                    </span>
                  ) : (
                    <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                      {t('cart_coupon')}
                    </span>
                  )}
                  </div>
                </div>
                <p className="text-2xl font-black mt-2">
                  {coupon.discountType === 'percentage' ? (
                    <>{coupon.discountValue}% OFF</>
                  ) : (
                    <>₹{coupon.discountValue} OFF</>
                  )}
                </p>
              </div>

              {/* Coupon Body */}
              <div className="p-6">
                {coupon.minPurchase > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    On orders above ₹{coupon.minPurchase}
                  </p>
                )}
                {coupon.type === 'product' && coupon.productId && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Valid on: {coupon.productId.name}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-2">
                  <Calendar size={14} />
                  <span>
                    Valid: {new Date(coupon.validFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {!isVendor && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400 mb-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <Store size={16} className="shrink-0" />
                    <span>
                      {t('offers_from_vendor').replace(
                        '{vendor}',
                        coupon.vendorId?.storeName || coupon.vendorId?.name || 'Vendor'
                      )}
                    </span>
                  </div>
                )}

                {coupon.usageLimit > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                    Only {coupon.usageLimit - coupon.usageCount} uses left!
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {isVendor ? (
                    <Button 
                      onClick={() => navigate('/vendor/dashboard')}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Manage in Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => copyCoupon(coupon.code)} variant="outline" className="flex-1 border-gray-200 dark:border-gray-700">
                        {t('copy')}
                      </Button>
                      <Button 
                        onClick={() => navigate('/checkout', { state: { applyCoupon: coupon.code } })}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {t('apply')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
