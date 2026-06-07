import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/cart';
import { useAuth } from '../context/auth';
import { useOrders } from '../context/orders';
import { useLang } from '../context/language';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { Tag, X } from 'lucide-react';
import { api } from '../../lib/api';
import {
  CHECKOUT_KEYS,
  clearCheckoutDraft,
  consumeFreshCheckoutSession,
  getDefaultCheckoutForm,
  loadCheckoutDraft,
  saveCheckoutDraft,
} from '../utils/checkoutDraft';

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function Checkout() {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { addOrder, refreshOrders, removeOrder } = useOrders();
  const navigate = useNavigate();
  const { t } = useLang();
  const location = useLocation();

  const [deliveryOption, setDeliveryOption] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [formData, setFormData] = useState(() => getDefaultCheckoutForm(user));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hydratedKey, setHydratedKey] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const paymentSettledRef = useRef(false);

  // Load active coupons from backend
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const data = await api.coupons.getActive();
        setCoupons(data);
      } catch (error) {
        console.error('Failed to load coupons:', error);
      } finally {
        setLoadingCoupons(false);
      }
    };
    loadCoupons();
  }, []);

  // Fresh checkout from cart (once) vs. resume after visiting offers / browser back
  useEffect(() => {
    const couponFromOffers = location.state?.applyCoupon;
    const startFresh = consumeFreshCheckoutSession();

    if (startFresh) {
      clearCheckoutDraft();
      setDeliveryOption('');
      setPaymentMethod('');
      setFormData(getDefaultCheckoutForm(user));
      setCoupon('');
      setDiscount(0);
      setAppliedCoupon(null);
      setErrors({});
      setTouched({});
    } else {
      // Stale history entry from older builds — do not wipe the in-progress draft
      if (location.state?.newCheckout) {
        navigate(location.pathname, {
          replace: true,
          state: couponFromOffers ? { applyCoupon: couponFromOffers } : null,
        });
      }
      const draft = loadCheckoutDraft();
      if (draft.form) setFormData(draft.form);
      if (draft.delivery) setDeliveryOption(draft.delivery);
      if (draft.payment) setPaymentMethod(draft.payment);
      if (couponFromOffers) {
        setCoupon(couponFromOffers);
      } else if (draft.coupon) {
        setCoupon(draft.coupon);
      }
      if (!couponFromOffers && draft.discount > 0) {
        setDiscount(draft.discount);
        if (draft.coupon) {
          setAppliedCoupon({ code: draft.coupon, amount: draft.discount });
        }
      }
    }

    setHydratedKey(location.key);
  }, [location.key, location.state?.applyCoupon, location.state?.newCheckout, user, navigate]);

  useEffect(() => {
    const code = location.state?.applyCoupon;
    if (!code || hydratedKey !== location.key) return;
    applyCoupon(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.applyCoupon, hydratedKey, location.key]);

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCoupon('');
    toast.message(t('coupon_removed') || 'Coupon removed');
  };

  const applyCoupon = async (codeOverride) => {
    const code = (codeOverride ?? coupon).trim();
    if (!code) {
      toast.error(t('enter_coupon') || 'Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    try {
      const c = await api.coupons.getByCode(code);
      const subtotal = getTotal();

      if (c.minPurchase > 0 && subtotal < c.minPurchase) {
        toast.error(`Cart total must be at least ₹${c.minPurchase} for this coupon`);
        return;
      }

      let discountAmount;
      if (c.discountType === 'percentage') {
        discountAmount = (subtotal * c.discountValue) / 100;
        if (c.maxDiscount > 0 && discountAmount > c.maxDiscount) {
          discountAmount = c.maxDiscount;
        }
      } else {
        discountAmount = c.discountValue;
      }

      discountAmount = Math.min(discountAmount, subtotal);
      setCoupon(c.code);
      setDiscount(discountAmount);
      setAppliedCoupon({ code: c.code, amount: discountAmount });
      toast.success(`Coupon applied! Discount: ₹${discountAmount.toFixed(2)}`);
    } catch (error) {
      toast.error(error.message || 'Invalid coupon code');
      setDiscount(0);
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "fullName":
        if (!value.trim()) error = t('err_full_name_required') || 'Full name is required';
        else if (value.trim().length < 3) error = t('err_full_name_too_short') || 'Full name must be at least 3 characters';
        break;
      case "phone":
        if (!value.trim()) error = t('err_phone_required') || 'Phone number is required';
        else if (!/^\d{10}$/.test(value.trim())) error = t('err_phone_digits') || 'Please enter a valid 10-digit phone number';
        break;
      case "email":
        if (!value.trim()) error = t('err_email_required') || 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) error = t('err_invalid_email') || 'Please enter a valid email';
        break;
      case "address":
        if (!value.trim()) error = t('err_address_required') || 'Address is required';
        else if (value.trim().length < 10) error = t('err_address_too_short') || 'Address is too short (min 10 chars)';
        break;
      case "city":
        if (!value.trim()) error = t('err_city_required') || 'City is required';
        break;
      case "zipCode":
        if (!value.trim()) error = t('err_zip_required') || 'ZIP code is required';
        else if (!/^\d{6}$/.test(value.trim())) error = t('err_zip_digits') || 'Please enter a valid 6-digit PIN';
        break;
      default:
        break;
    }
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate core delivery fields
    const coreFields = ['fullName', 'phone', 'email', 'address', 'city', 'zipCode'];
    coreFields.forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    // Validate delivery option selection
    if (!deliveryOption) {
      newErrors.deliveryOption = "Please select a delivery option";
    }

    // Validate payment method selection
    if (!paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }

    setErrors(newErrors);
    setTouched((prev) => ({ 
      ...prev, 
      ...Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
      deliveryOption: true,
      paymentMethod: true
    }));
    return Object.keys(newErrors).length === 0;
  };

  const handleDeliveryOptionChange = (value) => {
    setDeliveryOption(value);
    if (value) sessionStorage.setItem(CHECKOUT_KEYS.delivery, value);
    else sessionStorage.removeItem(CHECKOUT_KEYS.delivery);
    setErrors((prev) => ({ ...prev, deliveryOption: null }));
    setTouched((prev) => ({ ...prev, deliveryOption: true }));
  };

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
    if (value) sessionStorage.setItem(CHECKOUT_KEYS.payment, value);
    else sessionStorage.removeItem(CHECKOUT_KEYS.payment);
    setTouched((prev) => ({ ...prev, paymentMethod: true }));
    if (value !== 'card') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.paymentMethod;
        return newErrors;
      });
    } else {
      setErrors((prev) => ({ ...prev, paymentMethod: null }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  useEffect(() => {
    if (hydratedKey !== location.key) return;
    sessionStorage.setItem(CHECKOUT_KEYS.form, JSON.stringify(formData));
  }, [formData, hydratedKey, location.key]);
  useEffect(() => {
    if (hydratedKey !== location.key) return;
    sessionStorage.setItem(CHECKOUT_KEYS.coupon, coupon);
  }, [coupon, hydratedKey, location.key]);
  useEffect(() => {
    if (hydratedKey !== location.key) return;
    sessionStorage.setItem(CHECKOUT_KEYS.discount, String(discount));
  }, [discount, hydratedKey, location.key]);

  const abortOnlineCheckout = async (createdOrder, reason = 'cancelled') => {
    if (paymentSettledRef.current) return;
    paymentSettledRef.current = true;

    const orderId = createdOrder._id || createdOrder.id;
    try {
      await api.payment.cancel(orderId);
    } catch (err) {
      console.error('Failed to cancel unpaid order:', err);
    }
    removeOrder(orderId);
    setIsProcessing(false);
    if (reason === 'failed') {
      toast.error(t('payment_failed') || 'Payment failed. Your order was not placed.');
    } else {
      toast.error(t('payment_cancelled') || 'Payment cancelled. No order was placed.');
    }
  };

  const completeOnlinePayment = async () => {
    if (paymentSettledRef.current) return;
    paymentSettledRef.current = true;

    await clearCart();
    clearCheckoutDraft();
    await refreshOrders();
    toast.success(t('payment_success_order') || 'Payment successful! Your order has been placed.');
    navigate('/orders');
    setIsProcessing(false);
  };

  // Razorpay Integration
  const handleRazorpayPayment = async (createdOrder) => {
    paymentSettledRef.current = false;
    const orderId = createdOrder._id || createdOrder.id;
    const deliveryFee = deliveryOption === 'express' ? 40 : deliveryOption === 'sameday' ? 60 : 0;
    const totalPrice = Math.max(0, getTotal() + deliveryFee - discount);
    const amountInPaise = Math.round(totalPrice * 100);

    try {
      const razorpayOrder = await api.payment.createRazorpayOrder(amountInPaise, orderId);

      if (razorpayOrder.id?.startsWith('order_mock')) {
        toast.info('Processing payment (mock mode)...');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await api.payment.verify({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          orderId,
        });
        await completeOnlinePayment();
        return;
      }

      const res = await loadRazorpayScript();
      if (!res) {
        toast.error(t('payment_gateway_error') || 'Failed to load payment gateway. Please try again.');
        await abortOnlineCheckout(createdOrder, 'failed');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SwYwXRTNb2IXK3',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'GreenCart',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            await api.payment.verify({
              ...response,
              orderId,
            });
            await completeOnlinePayment();
          } catch (error) {
            console.error('Verification Error:', error);
            await abortOnlineCheckout(createdOrder, 'failed');
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: `${formData.address}, ${formData.city} ${formData.zipCode}`,
          orderId: String(orderId),
        },
        theme: { color: '#10B981' },
        modal: {
          ondismiss: function () {
            abortOnlineCheckout(createdOrder, 'cancelled');
          },
          escape: true,
          backdropclose: true,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        abortOnlineCheckout(createdOrder, 'failed');
      });
      rzp.open();
    } catch (error) {
      console.error('Razorpay Error:', error);
      await abortOnlineCheckout(createdOrder, 'failed');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    console.log('handlePlaceOrder called');

    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    console.log('Form validated successfully');

    setIsProcessing(true);

    try {
      const deliveryFee = deliveryOption === 'express' ? 40 : deliveryOption === 'sameday' ? 60 : 0;
      const totalPrice = Math.max(0, getTotal() + deliveryFee - discount);
      console.log('Total price:', totalPrice, 'Payment method:', paymentMethod);
      
      const orderItems = items.map(item => ({
        product: item.product?._id || item.productId || item.id || item._id,
        quantity: item.quantity,
        price: item.product?.price || item.price || 0,
      }));

      console.log('Creating order with data:', {
        items: orderItems,
        totalPrice,
        shippingAddress: `${formData.address}, ${formData.city} ${formData.zipCode}`,
        phoneNumber: formData.phone,
        paymentMethod,
        status: 'Pending',
        paid: paymentMethod === 'cod' ? false : true,
        userEmail: user.email,
      });
      
      const orderPayload = {
        items: orderItems,
        totalPrice,
        shippingAddress: `${formData.address}, ${formData.city} ${formData.zipCode}`,
        phoneNumber: formData.phone,
        paymentMethod,
        couponCode: discount > 0 ? coupon : undefined,
      };

      if (paymentMethod === 'cod') {
        await addOrder(orderPayload);
        await clearCart();
        clearCheckoutDraft();
        toast.success(t('order_placed_success') || 'Order placed successfully!');
        navigate('/orders');
        setIsProcessing(false);
      } else {
        // Online: reserve order, open Razorpay — only confirm after payment succeeds
        const createdOrder = await api.orders.create(orderPayload);
        await handleRazorpayPayment(createdOrder);
      }
    } catch (error) {
      console.error("Failed to place order:", error);
      toast.error(error.message || 'Failed to place order');
      setIsProcessing(false);
    }
  };

  const getDeliveryFee = () => {
    if (!deliveryOption) return 0;
    return deliveryOption === 'express' ? 40 : deliveryOption === 'sameday' ? 60 : 0;
  };

  const getGrandTotal = () => {
    const subtotal = getTotal();
    const deliveryFee = getDeliveryFee();
    return Math.max(0, subtotal + deliveryFee - discount);
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  if (!user) {
    navigate('/login');
    return null;
  }
  if (user.role === 'vendor') {
    navigate('/vendor/dashboard');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ←
        </Button>
      </div>
      <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white transition-colors">{t('checkout_title') || 'Checkout'}</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT SIDE - Forms */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 border-2 border-gray-100 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800 rounded-2xl transition-all hover:shadow-2xl">
              <h2 className="mb-6 text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                <span className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-600 dark:text-green-400 flex items-center justify-center text-base font-bold">1</span>
                {t('delivery_info') || 'Delivery Information'}
              </h2>
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300 font-medium">{t('full_name') || 'Full Name'}</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="John Doe"
                      className={`h-12 px-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${touched.fullName && errors.fullName ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900' : ''}`}
                    />
                    {touched.fullName && errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium">{t('phone_number') || 'Phone Number'}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="10 digit mobile number"
                      className={`h-12 px-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${touched.phone && errors.phone ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900' : ''}`}
                    />
                    {touched.phone && errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">{t('email') || 'Email Address'}</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="john@example.com"
                    className={`h-12 px-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${touched.email && errors.email ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900' : ''}`}
                  />
                  {touched.email && errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700 dark:text-gray-300 font-medium">{t('street_address') || 'Street Address'}</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="House No., Building, Area"
                    className={`h-12 px-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${touched.address && errors.address ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900' : ''}`}
                  />
                  {touched.address && errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-gray-700 dark:text-gray-300 font-medium">{t('city') || 'City'}</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="City"
                      className={`h-12 px-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${touched.city && errors.city ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900' : ''}`}
                    />
                    {touched.city && errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-gray-700 dark:text-gray-300 font-medium">{t('zip_code') || 'ZIP Code'}</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="6 digit PIN"
                      className={`h-12 px-4 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${touched.zipCode && errors.zipCode ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900' : ''}`}
                    />
                    {touched.zipCode && errors.zipCode && <p className="text-xs text-red-500 mt-1">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>
            </Card>

            <Card className={`p-8 border-2 shadow-xl bg-white dark:bg-gray-800 rounded-2xl transition-all hover:shadow-2xl ${touched.deliveryOption && errors.deliveryOption ? "border-red-500 ring-2 ring-red-200 dark:ring-red-900" : "border-gray-100 dark:border-gray-700"}`}>
              <h2 className="mb-6 text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                <span className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-600 dark:text-green-400 flex items-center justify-center text-base font-bold">2</span>
                {t('delivery_options') || 'Delivery Options'}
              </h2>
              {touched.deliveryOption && errors.deliveryOption && <p className="mb-4 text-sm text-red-500">{errors.deliveryOption}</p>}
              <RadioGroup
                name="checkout-delivery"
                value={deliveryOption}
                onValueChange={handleDeliveryOptionChange}
                className="grid gap-4"
              >
                <Label
                  htmlFor="standard"
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 ${
                    deliveryOption === 'standard' ? 'border-green-600 bg-green-50/50 dark:bg-green-900/30 ring-2 ring-green-200 dark:ring-green-900' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value="standard" id="standard" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">Standard Delivery</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Delivered in 2-3 days</p>
                    </div>
                  </div>
                  <span className="font-black text-green-600 dark:text-green-400 text-xl">FREE</span>
                </Label>

                <Label
                  htmlFor="express"
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 ${
                    deliveryOption === 'express' ? 'border-green-600 bg-green-50/50 dark:bg-green-900/30 ring-2 ring-green-200 dark:ring-green-900' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value="express" id="express" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">Express Delivery</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Usually within 24 hours</p>
                    </div>
                  </div>
                  <span className="font-black text-green-600 dark:text-green-400 text-xl">₹40</span>
                </Label>

                <Label
                  htmlFor="sameday"
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 ${
                    deliveryOption === 'sameday' ? 'border-green-600 bg-green-50/50 dark:bg-green-900/30 ring-2 ring-green-200 dark:ring-green-900' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <RadioGroupItem value="sameday" id="sameday" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">Same Day Delivery</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Order before 2 PM</p>
                    </div>
                  </div>
                  <span className="font-black text-green-600 dark:text-green-400 text-xl">₹60</span>
                </Label>
              </RadioGroup>
            </Card>

            <Card className={`p-8 border-2 shadow-xl bg-white dark:bg-gray-800 rounded-2xl transition-all hover:shadow-2xl ${touched.paymentMethod && errors.paymentMethod ? "border-red-500 ring-2 ring-red-200 dark:ring-red-900" : "border-gray-100 dark:border-gray-700"}`}>
              <h2 className="mb-6 text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                <span className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-600 dark:text-green-400 flex items-center justify-center text-base font-bold">3</span>
                {t('payment_method') || 'Payment Method'}
              </h2>
              {touched.paymentMethod && errors.paymentMethod && <p className="mb-4 text-sm text-red-500">{errors.paymentMethod}</p>}
              <RadioGroup
                name="checkout-payment"
                value={paymentMethod}
                onValueChange={handlePaymentMethodChange}
                className="grid gap-4"
              >
                <Label
                  htmlFor="cod"
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 ${
                    paymentMethod === 'cod' ? 'border-green-600 bg-green-50/50 dark:bg-green-900/30 ring-2 ring-green-200 dark:ring-green-900' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <RadioGroupItem value="cod" id="cod" />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">Cash on Delivery</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pay when you receive the order</p>
                  </div>
                </Label>

                <Label
                  htmlFor="card"
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 ${
                    paymentMethod === 'card' ? 'border-green-600 bg-green-50/50 dark:bg-green-900/30 ring-2 ring-green-200 dark:ring-green-900' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">UPI / Card / Netbanking</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pay securely via Razorpay</p>
                  </div>
                </Label>
              </RadioGroup>
            </Card>
          </div>

          {/* RIGHT SIDE - Order Summary */}
          <div>
            <Card className="sticky top-24 p-8 border-2 border-gray-100 dark:border-gray-700 shadow-2xl bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
              <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-gray-200 dark:border-gray-700 pb-4">{t('checkout_summary') || 'Order Summary'}</h2>

              <div className="mb-6 max-h-80 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {items.map((item) => {
                  const productId = item.product?._id || item.product?.id || item.id || item._id;
                  const productName = item.product?.name || item.name;
                  const productPrice = item.product?.price || item.price || 0;
                  return (
                  <div key={productId} className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{productName} x {item.quantity}</p>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">₹{(productPrice * item.quantity).toFixed(2)}</span>
                  </div>
                );
                })}
              </div>

              <div className="mt-6 border-t-2 border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">{t('subtotal') || 'Subtotal'}</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">₹{getTotal().toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">{t('delivery_fee') || 'Delivery Fee'}</span>
                  <span
                    className={`font-bold text-lg ${
                      !deliveryOption
                        ? 'text-gray-400 dark:text-gray-500'
                        : getDeliveryFee() === 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {!deliveryOption
                      ? '—'
                      : getDeliveryFee() === 0
                        ? 'FREE'
                        : `₹${getDeliveryFee()}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-green-700 dark:text-green-400 font-bold text-lg bg-green-100 dark:bg-green-900/30 p-3 rounded-xl border border-green-200 dark:border-green-800">
                    <span>🎉 Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="mt-6 flex justify-between items-center border-t-2 border-gray-200 dark:border-gray-700 pt-5 text-xl font-black">
                  <span className="text-gray-900 dark:text-white">{t('total') || 'Total'}</span>
                  <span className="text-green-600 dark:text-green-400 text-2xl">
                    ₹{getGrandTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/25">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
                        <Tag className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-green-800 dark:text-green-300 truncate">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          {(t('coupon_applied_save') || 'You save ₹{amount}').replace(
                            '{amount}',
                            appliedCoupon.amount.toFixed(2)
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeCoupon}
                      className="shrink-0 h-11 px-4 rounded-xl border-green-400 text-green-800 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/40 gap-1.5 font-semibold"
                    >
                      <X className="h-4 w-4" />
                      {t('remove_coupon') || 'Remove'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-stretch gap-3">
                    <Input
                      placeholder={t('enter_coupon') || 'Enter coupon code'}
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      className="flex-1 h-14 px-5 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <Button
                      type="button"
                      onClick={() => applyCoupon()}
                      disabled={applyingCoupon}
                      className="h-14 px-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 whitespace-nowrap font-bold rounded-xl shadow-lg shadow-green-200 dark:shadow-none transition-all hover:shadow-xl"
                    >
                      {applyingCoupon
                        ? t('applying') || 'Applying...'
                        : t('apply') || 'Apply'}
                    </Button>
                  </div>
                )}
                {!loadingCoupons && coupons.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Available Coupons:</p>
                    <div className="space-y-2">
                      {coupons.slice(0, 3).map(c => {
                        const isActive =
                          appliedCoupon?.code?.toUpperCase() === c.code?.toUpperCase();
                        return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() =>
                            isActive ? removeCoupon() : applyCoupon(c.code)
                          }
                          className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ${
                            isActive
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 ring-2 ring-green-400/50'
                              : 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 hover:shadow-md'
                          }`}
                        >
                          <p className="font-bold text-yellow-700 dark:text-yellow-400">{c.code}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {c.discountType === 'percentage' ? `${c.discountValue}% off` : `Flat ₹${c.discountValue} off`}
                            {c.minPurchase > 0 && ` on orders above ₹${c.minPurchase}`}
                          </p>
                          {isActive && (
                            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mt-1">
                              {t('tap_to_remove_coupon') || 'Tap again to remove'}
                            </p>
                          )}
                        </button>
                      );
                      })}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  className="text-sm text-green-700 dark:text-green-400 hover:underline font-semibold flex items-center gap-2"
                  onClick={() => {
                    saveCheckoutDraft({
                      form: formData,
                      delivery: deliveryOption,
                      payment: paymentMethod,
                      coupon,
                      discount,
                    });
                    navigate('/offers');
                  }}
                >
                  → {t('view_offers') || 'View all offers'}
                </button>
              </div>

              <Button
                type="submit"
                className="mt-10 w-full py-7 text-xl font-black shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 rounded-2xl"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" />
                    {paymentMethod === 'card'
                      ? (t('opening_payment') || 'Opening payment...')
                      : (t('processing_order') || 'Processing...')}
                  </span>
                ) : paymentMethod === 'card' ? (
                  `${t('pay_now_checkout') || 'Pay'} ₹${getGrandTotal().toFixed(2)}`
                ) : (
                  t('place_order') || 'Place Order'
                )}
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
