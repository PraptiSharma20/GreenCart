import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/cart';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useLang } from '../context/language';
import { useAuth } from '../context/auth';
import { localizeProduct } from '../i18n/productTranslations';
import { beginCheckoutSession } from '../utils/checkoutDraft';

export function Cart() {
  const { items, updateQuantity, removeFromCart, getTotal } = useCart();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { user } = useAuth();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 shadow-sm transition-colors duration-300">
            <span className="text-6xl">🛒</span>
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white transition-colors">{t('empty_cart_title')}</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400 transition-colors">{t('empty_cart_sub')}</p>
        <Button size="lg" onClick={() => navigate('/')}>
          {t('hero_cta')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white transition-colors">{t('cart')}</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const rawProduct = item.product || item;
            const product = localizeProduct(rawProduct, lang);
            const productId = rawProduct?._id || rawProduct?.id || item._id || item.id;
            const productName = product?.name || "Product";
            const productImage = product?.image || "https://images.unsplash.com/photo-1464226184884-fa280b89c0ca?w=200";
            const productPrice = Number(product?.price) || 0;
            const productUnit = product?.unit || 'per kg';
            const productVendor = product?.vendor ? (product.vendor.name || "Vendor") : "";
            return (
            <Card key={productId || Math.random()} className="p-4 border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:shadow-md transition-all duration-300">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 transition-colors">
                  <img
                    src={productImage}
                    alt={productName}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Product Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3
                          className="font-semibold cursor-pointer hover:text-green-600 dark:hover:text-green-500 text-gray-900 dark:text-white transition-colors"
                          onClick={() => productId && navigate(`/product/${productId}`)}
                        >
                          {productName}
                        </h3>
                        {productVendor && <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">{productVendor}</p>}
                        <p className="mt-1 text-lg font-bold text-green-700 dark:text-green-500 transition-colors">
                          ₹{productPrice.toFixed(2)} <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{productUnit}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => productId && removeFromCart(productId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                        onClick={() => productId && updateQuantity(productId, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium text-gray-900 dark:text-white transition-colors">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-500 transition-colors"
                        onClick={() => productId && updateQuantity(productId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white transition-colors">
                        ₹{(productPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 p-6 border-gray-200 dark:border-gray-700 dark:bg-gray-800 shadow-lg transition-all duration-300">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white transition-colors">{t('checkout_summary')}</h2>

            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4 transition-colors">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 transition-colors">{t('subtotal')}</span>
                <span className="font-medium text-gray-900 dark:text-white transition-colors">₹{getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 transition-colors">{t('delivery_fee')}</span>
                <span className="font-medium text-green-700 dark:text-green-500 transition-colors">{t('free')}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3 text-lg transition-colors">
                <span className="font-semibold text-gray-900 dark:text-white transition-colors">{t('total')}</span>
                <span className="font-bold text-green-700 dark:text-green-500 transition-colors">₹{getTotal().toFixed(2)}</span>
              </div>
            </div>

            {user?.role === 'vendor' ? (
              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={() => navigate('/vendor/dashboard')}
              >
                {t('dashboard')}
              </Button>
            ) : (
              <Button
                className="mt-6 w-full shadow-lg shadow-green-100 dark:shadow-none transition-all"
                size="lg"
                onClick={() => {
                  if (user) beginCheckoutSession();
                  navigate(user ? '/checkout' : '/login');
                }}
              >
                {t('proceed_to_checkout')}
              </Button>
            )}

            <Button
              variant="outline"
              className="mt-3 w-full border-gray-200 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              onClick={() => navigate('/')}
            >
              {t('continue_shopping')}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
