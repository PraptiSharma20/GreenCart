import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useLang } from '../context/language';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Package, IndianRupee, TrendingUp, Loader2, LayoutDashboard, ShoppingBag, BarChart2, Plus, Settings, LogOut, Menu, X, Bell, User, ChevronRight, ArrowUpRight, Clock, CheckCircle2, Trash2, Phone, MapPin, ShieldCheck, CreditCard, Smartphone, Star, AlertTriangle, Edit2, Tag, RefreshCcw, Truck } from 'lucide-react';
import { VendorDeliveryPartners } from '../components/VendorDeliveryPartners';
import { api } from '../../lib/api';
import { VendorProducts } from '../components/VendorProducts';
import { VendorOrders } from '../components/VendorOrders';
import { VendorAnalytics } from '../components/VendorAnalytics';
import { VendorCoupons } from '../components/VendorCoupons';
import { VendorReviews } from '../components/VendorReviews';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { collapseNotificationsForDisplay } from '../utils/notificationUtils';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export function VendorDashboard() {
  const { user, logout, updateProfile, fetchProfile, isAuthenticated } = useAuth();
  const { t, tStatus, lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    productReviews: true,
    paymentAlerts: true
  });
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const notificationContainerRef = useRef(null);
  
  const [tab, setTab] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get('tab') || 'overview';
  });
  
  // Calculate dynamic profile completion percentage
  const calculateProfileCompletion = () => {
    let totalFields = 12; 
    let completedFields = 0;
    
    if (user?.name?.trim()) completedFields++;
    if (user?.phoneNumber?.trim()) completedFields++;
    if (user?.storeName?.trim()) completedFields++;
    if (user?.storeDescription?.trim()) completedFields++;
    if (user?.address?.trim()) completedFields++;
    if (user?.gender) completedFields++;
    if (user?.languagesSpoken && user.languagesSpoken.length > 0) completedFields++;
    if (user?.pincode?.trim()) completedFields++;
    if (user?.city?.trim()) completedFields++;
    if (user?.state?.trim()) completedFields++;
    if (payoutMethods.length > 0) completedFields++;
    // Email is always present, so we'll count it as completed
    completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  };
  
  const profileCompletion = calculateProfileCompletion();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    storeName: user?.storeName || '',
    storeDescription: user?.storeDescription || '',
    address: user?.address || '',
    gender: user?.gender || '',
    languagesSpoken: user?.languagesSpoken || [],
    pincode: user?.pincode || '',
    city: user?.city || '',
    state: user?.state || ''
  });

  // Payout form state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [newPayoutMethod, setNewPayoutMethod] = useState({
    type: 'bank',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    upiId: '',
    isPrimary: false
  });
  
  // Payout delete confirmation state
  const [isDeletePayoutModalOpen, setIsDeletePayoutModalOpen] = useState(false);
  const [payoutMethodToDelete, setPayoutMethodToDelete] = useState(null);
  // Store profile edit modal state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    if (user && !isEditProfileModalOpen) {
      setProfileForm({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        storeName: user.storeName || '',
        storeDescription: user.storeDescription || '',
        address: user.address || '',
        gender: user.gender || '',
        languagesSpoken: user.languagesSpoken || [],
        pincode: user.pincode || '',
        city: user.city || '',
        state: user.state || ''
      });
      setPayoutMethods(user.payoutMethods || []);
      setNotifications(user.notifications || {
        orderUpdates: true,
        productReviews: true,
        paymentAlerts: true
      });
    }
  }, [user, isEditProfileModalOpen]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error(t('err_login_first'));
      return;
    }

    // Profile field validations
    if (!profileForm.name.trim()) {
      toast.error(t('err_full_name_required'));
      return;
    }
    if (profileForm.name.length < 3) {
      toast.error(t('err_name_min_length'));
      return;
    }
    if (!profileForm.phoneNumber.trim()) {
      toast.error(t('err_phone_required'));
      return;
    }
    // Phone number validation (only digits, spaces, hyphens, and + are allowed; must have at least 10 digits
    const phoneRegex = /^[+\d\s-]*$/;
    const digitsOnly = profileForm.phoneNumber.replace(/\D/g, ''); // Remove all non-digit characters
    if (!phoneRegex.test(profileForm.phoneNumber)) {
      toast.error(t('err_phone_invalid'));
      return;
    }
    if (digitsOnly.length < 10) {
      toast.error(t('err_phone_min_digits'));
      return;
    }
    if (!profileForm.storeName.trim()) {
      toast.error(t('err_store_name_required'));
      return;
    }
    if (profileForm.storeName.length < 2) {
      toast.error(t('err_store_name_min'));
      return;
    }
    if (!profileForm.address.trim()) {
      toast.error(t('err_store_address_required'));
      return;
    }
    if (!profileForm.pincode.trim()) {
      toast.error(t('err_pincode_required'));
      return;
    }
    if (!/^\d{6}$/.test(profileForm.pincode)) {
      toast.error(t('err_pincode_digits'));
      return;
    }
    if (!profileForm.city.trim()) {
      toast.error(t('err_city_required'));
      return;
    }
    if (!profileForm.state.trim()) {
      toast.error(t('err_state_required'));
      return;
    }
    if (!profileForm.storeDescription.trim()) {
      toast.error(t('err_store_description_required'));
      return;
    }

    try {
      await updateProfile(profileForm);
      await fetchProfile();
      toast.success(t('err_store_profile_updated'));
      setIsEditProfileModalOpen(false);
    } catch (error) {
      toast.error(error.message || t('err_update_profile_fail'));
    }
  };



  const handleAddPayoutMethod = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error(t('err_login_first'));
      return;
    }

    // Validate payout method fields
    if (newPayoutMethod.type === 'bank') {
      if (!newPayoutMethod.bankName.trim()) {
        toast.error(t('err_bank_name_required'));
        return;
      }
      if (!newPayoutMethod.accountHolder.trim()) {
        toast.error(t('err_account_holder_required'));
        return;
      }
      if (!newPayoutMethod.accountNumber.trim()) {
        toast.error(t('err_account_number_required'));
        return;
      }
      if (newPayoutMethod.accountNumber.length < 8) {
        toast.error(t('err_account_number_required'));
        return;
      }
    } else {
      if (!newPayoutMethod.accountHolder.trim()) {
        toast.error(t('err_account_holder_required'));
        return;
      }
      if (!newPayoutMethod.upiId.trim()) {
        toast.error(t('err_upi_required'));
        return;
      }
      // Basic UPI validation
      if (!newPayoutMethod.upiId.includes('@')) {
        toast.error(t('err_upi_invalid'));
        return;
      }
    }

    try {
      const data = await api.auth.addPayoutMethod(newPayoutMethod);
      setPayoutMethods(data.payoutMethods);
      await fetchProfile();
      setNewPayoutMethod({
        type: 'bank',
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        upiId: '',
        isPrimary: false
      });
      setIsPayoutModalOpen(false);
      toast.success(t('err_payout_added'));
    } catch (error) {
      toast.error(t('err_payout_add_fail'));
    }
  };

  const handleRemovePayoutMethod = async () => {
    try {
      const data = await api.auth.removePayoutMethod(payoutMethodToDelete._id);
      setPayoutMethods(data.payoutMethods);
      await fetchProfile();
      toast.success(t('err_payout_removed'));
      setIsDeletePayoutModalOpen(false);
      setPayoutMethodToDelete(null);
    } catch (error) {
      toast.error(t('err_payout_remove_fail'));
    }
  };

  const handleSetPrimaryPayoutMethod = async (methodId) => {
    try {
      const data = await api.auth.setPrimaryPayoutMethod(methodId);
      setPayoutMethods(data.payoutMethods);
      await fetchProfile();
      toast.success(t('err_payout_primary_updated'));
    } catch (error) {
      toast.error(t('err_payout_primary_fail'));
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setNotificationsLoading(true);
      const data = await api.auth.getNotifications();
      setNotificationsList(collapseNotificationsForDisplay(data));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await api.auth.markNotificationRead(id);
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const markAllRead = async () => {
    try {
      await api.auth.markAllNotificationsRead();
      await fetchNotifications();
      toast.success(t('all_notifications_read'));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const t = p.get('tab') || 'overview';
    setTab(t);
  }, [location.search]);

  const isVendor = user?.role === "vendor";

  // Fetch notifications on user change and refresh periodically
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    // Add event listener when panel is open
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role === "admin") {
      navigate("/admin/dashboard");
      return;
    }
    if (!isVendor) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      try {
        const ordersData = await api.vendor.getOrders().catch(() => []);
        setRecentOrders(ordersData.slice(0, 5));

        const statsData = await api.vendor.getStats().catch(() => ({
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalRefunds: 0,
          pendingOrders: 0,
          revenueHistory: []
        }));

        // We prioritize the data from ordersData as it's the source of truth for the UI
        const vendorId = String(user.id || user._id);
        const calculateStatsFromOrders = (orders) => {
          let revenue = 0;
          let refunds = 0;
          orders.forEach((order) => {
            const isRefunded =
              order.status === "Refunded" || order.paymentStatus === "Refunded";
            (order.items || []).forEach((item) => {
              const itemVendor = item.vendor?._id || item.vendor;
              if (String(itemVendor) !== vendorId) return;
              const itemTotal = item.price * item.quantity;
              if (isRefunded) refunds += itemTotal;
              else revenue += itemTotal;
            });
          });
          return { revenue, refunds };
        };

        const { revenue, refunds } = calculateStatsFromOrders(ordersData);

        const finalStats = {
          ...statsData,
          totalOrders: ordersData.length,
          pendingOrders: ordersData.filter(o => o.status === 'Pending').length,
          totalRevenue: revenue,
          totalRefunds: refunds
        };

        setStats(finalStats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, isVendor]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success(t('logout_vendor_success'));
  };

  const menuItems = useMemo(
    () => [
      { id: 'overview', label: t('overview'), icon: LayoutDashboard, color: 'text-emerald-500', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20', darkColor: 'dark:text-emerald-400' },
      { id: 'products', label: t('products'), icon: Package, color: 'text-blue-500', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/20', darkColor: 'dark:text-blue-400' },
      { id: 'coupons', label: t('coupons'), icon: Tag, color: 'text-green-500', bg: 'bg-green-50', darkBg: 'dark:bg-green-900/20', darkColor: 'dark:text-green-400' },
      { id: 'orders', label: t('orders'), icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/20', darkColor: 'dark:text-amber-400' },
      { id: 'delivery-partners', label: t('delivery_partners_menu'), icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-900/20', darkColor: 'dark:text-indigo-400' },
      { id: 'reviews', label: t('reviews'), icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50', darkBg: 'dark:bg-yellow-900/20', darkColor: 'dark:text-yellow-400' },
      { id: 'analytics', label: t('analytics'), icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-50', darkBg: 'dark:bg-purple-900/20', darkColor: 'dark:text-purple-400' },
      { id: 'settings', label: t('settings'), icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50', darkBg: 'dark:bg-slate-900/20', darkColor: 'dark:text-slate-400' },
    ],
    [lang, t]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-500 animate-pulse font-medium">{t('loading_dashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col z-30`}
      >
        <nav className="flex-1 px-4 space-y-4 mt-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                navigate(`/vendor/dashboard?tab=${item.id}`);
              }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 group ${
                tab === item.id 
                  ? `${item.bg} ${item.darkBg} ${item.color} ${item.darkColor} font-black shadow-sm scale-[1.02]` 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className={`transition-all duration-300 ${
                tab === item.id ? 'scale-110' : 'group-hover:scale-110'
              } ${tab === item.id ? `${item.color} ${item.darkColor}` : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                <item.icon size={22} strokeWidth={tab === item.id ? 2.5 : 2} />
              </div>
              {isSidebarOpen && <span className="text-sm tracking-tight">{item.label}</span>}
              {tab === item.id && isSidebarOpen && (
                <div className={`ml-auto w-1.5 h-1.5 rounded-full ${item.color.replace('text-', 'bg-')} ${item.darkColor.replace('text-', 'bg-')} animate-pulse`} />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          {/* User profile removed from sidebar bottom */}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 z-20 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {menuItems.find(m => m.id === tab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-300 relative group"
              >
                <Bell size={24} className="group-hover:scale-110 transition-transform" />
                {notificationsList.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-pulse">
                    {notificationsList.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Panel */}
              {showNotifications && (
                <div ref={notificationContainerRef} className="absolute right-0 z-[9999] mt-2 w-[min(480px,calc(100vw-1.5rem))] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-none">
                        <Bell size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">{t('notifications_title')}</h3>
                        {notificationsList.filter(n => !n.read).length > 0 && (
                          <span className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm mt-1">
                            {notificationsList.filter(n => !n.read).length} {t('new_count')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {notificationsList.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAllRead();
                          }}
                          className="text-sm font-black bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          {t('mark_all_read')}
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 transition-all duration-300"
                      >
                        <X size={22} />
                      </button>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className={`overflow-y-auto custom-scrollbar transition-all duration-300 ${showAllNotifications ? 'max-h-[600px]' : 'max-h-[400px]'}`}>
                    {notificationsLoading ? (
                      <div className="p-16 text-center text-gray-500 dark:text-gray-400">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 mx-auto mb-6 flex items-center justify-center">
                          <Loader2 className="h-10 w-10 animate-spin text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="font-black text-lg">{t('loading_notifications')}</p>
                      </div>
                    ) : notificationsList.length === 0 ? (
                      <div className="p-16 text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mx-auto mb-6 flex items-center justify-center">
                          <Bell size={48} className="text-green-500 dark:text-green-400" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-3">{t('no_notifications')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-base">{t('no_notifications_desc')}</p>
                      </div>
                    ) : (
                      <>
                        {(showAllNotifications ? notificationsList : notificationsList.slice(0, 3)).map((notification, index) => {
                          // Get icon based on notification type
                          let NotificationIcon = ShoppingBag;
                          let iconBg = "from-green-500 to-emerald-600";
                          if (notification.type === "product_review") {
                            NotificationIcon = Star;
                            iconBg = "from-yellow-500 to-amber-600";
                          } else if (notification.type === "payment_alert") {
                            NotificationIcon = IndianRupee;
                            iconBg = "from-blue-500 to-indigo-600";
                          }
                          
                          return (
                            <div
                              key={notification._id}
                              onClick={async () => {
                                await markAsRead(notification._id);
                                if (notification.type === 'product_review') {
                                  setShowNotifications(false);
                                  setTab('reviews');
                                  navigate('/vendor/dashboard?tab=reviews');
                                }
                              }}
                              className={`group p-6 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 ${
                                !notification.read ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10" : ""
                              }`}
                            >
                              <div className="flex items-start gap-5">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                  <NotificationIcon size={28} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-black text-lg ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{notification.title}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{notification.message}</p>
                                  <div className="flex items-center gap-2 mt-3">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-black">
                                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notification.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                                {!notification.read && (
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-md animate-pulse flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* View All Button */}
                        {notificationsList.length > 0 && (
                          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowNotifications(false);
                                navigate('/vendor/notifications');
                              }}
                              className="w-full text-center font-black bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 text-lg"
                            >
                              {t('view_all_notifications_btn')}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('official_vendor')}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black shadow-xl shadow-green-200 dark:shadow-none">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50 dark:bg-gray-900 transition-colors">
          {tab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('welcome_back_name')}, {user?.name.split(' ')[0]}! 👋</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{t('store_today')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 dark:shadow-none h-11 px-5 rounded-xl font-bold" onClick={() => setTab('products')}>
                    <Plus size={16} /> {t('add_product_btn')}
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: t('total_revenue'), value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800', trend: stats?.totalRevenue > 0 ? '+12.5%' : t('no_data') },
                  { label: t('total_refunds'), value: `₹${(stats?.totalRefunds || 0).toLocaleString()}`, icon: RefreshCcw, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-800', trend: stats?.totalRefunds > 0 ? t('processed') : t('no_refunds') },
                  { label: t('total_orders'), value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800', trend: stats?.totalOrders > 0 ? '+5.4%' : t('no_data') },
                  { label: t('products'), value: stats?.totalProducts || 0, icon: Package, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800', trend: stats?.totalProducts > 0 ? '0%' : t('no_data') },
                  { label: t('pending_orders'), value: stats?.pendingOrders || 0, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800', trend: stats?.pendingOrders > 0 ? t('action_needed') : t('no_data') },
                ].map((s, idx) => (
                  <Card key={idx} className={`p-6 border-none dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative`}>
                    <div className={`absolute -right-4 -top-4 w-20 h-20 ${s.bg} rounded-full opacity-30 group-hover:scale-150 transition-transform duration-500`} />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className={`p-3 rounded-2xl ${s.bg} ${s.color} group-hover:scale-110 transition-transform`}>
                        <s.icon size={24} />
                      </div>
                      <Badge variant="secondary" className={`${s.bg} ${s.color} border-none font-bold`}>
                        {s.trend}
                      </Badge>
                    </div>
                    <div className="relative z-10">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{s.value}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Orders Preview */}
                <Card className="lg:col-span-2 p-6 border-none dark:bg-gray-800 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">{t('latest_transactions')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_recent_orders_desc')}</p>
                    </div>
                    <Button variant="ghost" className="text-green-600 dark:text-green-500 font-bold hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl" onClick={() => setTab('orders')}>
                      {t('view_all')} <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    {recentOrders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                              <th className="pb-4 font-black">{t('table_order_id')}</th>
                              <th className="pb-4 font-black">{t('table_customer')}</th>
                              <th className="pb-4 font-black">{t('table_status')}</th>
                              <th className="pb-4 font-black text-right">{t('table_amount')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {recentOrders.map((order) => (
                              <tr key={order._id || order.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="py-4 font-mono text-sm font-bold text-gray-900 dark:text-gray-200">#{ (order._id || order.id)?.toString()?.slice(-6).toUpperCase() || 'N/A' }</td>
                                <td className="py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center justify-center text-[10px] font-bold">
                                      {order.user?.name?.charAt(0)}
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{order.user?.name}</span>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <Badge className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border-none ${
                                    order.status === 'Delivered' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                    order.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  }`}>
                                    {tStatus(order.status)}
                                  </Badge>
                                </td>
                                <td className="py-4 text-right font-black text-gray-900 dark:text-white">
                                  ₹{(order.vendorSubtotal ?? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-full flex items-center justify-center mb-6 transition-all duration-300">
                          <ShoppingBag size={36} className="text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('no_recent_orders_title')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{t('no_recent_orders_desc')}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Quick Chart & Health */}
                <div className="space-y-6">
                  <Card className="p-6 border-none dark:bg-gray-800 shadow-sm bg-white transition-colors overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{t('weekly_revenue')}</h3>
                      {stats?.revenueHistory && stats.revenueHistory.length > 0 ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+12%</span>
                      ) : (
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('no_data_yet_short')}</span>
                      )}
                    </div>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.revenueHistory && stats.revenueHistory.length > 0 ? stats.revenueHistory : []}>
                          {stats?.revenueHistory && stats.revenueHistory.length > 0 && (
                            <>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                            </>
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                      {(!stats?.revenueHistory || stats.revenueHistory.length === 0) && (
                        <div className="flex items-center justify-center h-32 w-full text-center text-gray-500 dark:text-gray-400">
                          {t('no_revenue_yet')}
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6 border-none shadow-sm bg-gradient-to-br from-green-600 to-green-700 text-white relative overflow-hidden group shadow-lg shadow-green-100 dark:shadow-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        {profileCompletion === 100 ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />} {t('store_health')}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="opacity-80">{t('profile_completion')}</span>
                          <span>{profileCompletion}%</span>
                        </div>
                        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.5)] ${profileCompletion === 100 ? 'bg-white' : 'bg-yellow-300'}`}
                            style={{ width: `${profileCompletion}%` }}
                          />
                        </div>
                        <p className="text-[10px] leading-relaxed opacity-80">
                          {profileCompletion === 100 
                            ? t('store_health_excellent')
                            : profileCompletion >= 50
                            ? t('store_health_good')
                            : t('store_health_start')}
                        </p>
                        <Button 
                          className="w-full bg-white text-green-700 hover:bg-green-50 border-none font-bold text-xs h-10 rounded-xl shadow-lg flex items-center justify-center gap-2"
                          onClick={() => {
                            if (profileCompletion === 100) {
                              setTab('analytics');
                            } else {
                              setTab('settings');
                            }
                          }}
                        >
                          {profileCompletion === 100 ? (
                            <>
                              <TrendingUp size={14} />
                              {t('vendor_view_analytics')}
                            </>
                          ) : (
                            <>
                              <Settings size={14} />
                              {t('complete_profile')}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-none dark:bg-gray-800 shadow-sm bg-white transition-colors">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">{t('quick_actions')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setTab('coupons')}
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all group"
                      >
                        <Tag size={20} className="mb-2 text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400" />
                        <span className="text-[10px] font-bold dark:text-gray-300">{t('create_coupon')}</span>
                      </button>
                      <button 
                        onClick={() => navigate('/vendor/notifications')}
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
                      >
                        <Bell size={20} className="mb-2 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        <span className="text-[10px] font-bold dark:text-gray-300">{t('notifications')}</span>
                      </button>
                      <button 
                        onClick={() => setTab('settings')}
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all group"
                      >
                        <CreditCard size={20} className="mb-2 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                        <span className="text-[10px] font-bold dark:text-gray-300">{t('payouts')}</span>
                      </button>
                      <button 
                        onClick={() => setTab('settings')}
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all group"
                      >
                        <Settings size={20} className="mb-2 text-gray-400 dark:text-gray-500 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                        <span className="text-[10px] font-bold dark:text-gray-300">{t('edit_profile')}</span>
                      </button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VendorProducts />
            </div>
          )}

          {tab === 'coupons' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VendorCoupons />
            </div>
          )}

          {tab === 'orders' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VendorOrders />
            </div>
          )}

          {tab === 'delivery-partners' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VendorDeliveryPartners />
            </div>
          )}

          {tab === 'reviews' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VendorReviews />
            </div>
          )}

          {tab === 'analytics' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <VendorAnalytics />
            </div>
          )}

          {tab === 'settings' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {/* Store Profile Card (View Only) */}
              <Card className="p-6 border-none shadow-sm bg-white dark:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <User size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('store_profile')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('store_profile_desc')}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setProfileForm({
                        name: user?.name || '',
                        email: user?.email || '',
                        phoneNumber: user?.phoneNumber || '',
                        storeName: user?.storeName || '',
                        storeDescription: user?.storeDescription || '',
                        address: user?.address || '',
                        gender: user?.gender || '',
                        languagesSpoken: user?.languagesSpoken || [],
                        pincode: user?.pincode || '',
                        city: user?.city || '',
                        state: user?.state || ''
                      });
                      setIsEditProfileModalOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 dark:shadow-none h-10 px-4 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Edit2 size={18} /> {t('edit_profile')}
                  </Button>
                </div>
                
                <div className="space-y-5">
                  {/* Show only 4 key fields initially */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('full_name_label')}</Label>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl">
                        <p className="font-medium dark:text-white">{user?.name || t('not_provided')}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('business_email')}</Label>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl">
                        <p className="font-medium dark:text-white">{user?.email || t('not_provided')}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Phone size={14} /> {t('phone_number_label')}
                      </Label>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl">
                        <p className="font-medium dark:text-white">{user?.phoneNumber || t('not_provided')}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('store_name')}</Label>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl">
                        <p className="font-medium dark:text-white">{user?.storeName || t('not_provided')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payout Methods Card */}
                <Card className="p-6 border-none shadow-sm bg-white dark:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <CreditCard size={24} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('payout_methods')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('payout_methods_desc')}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setIsPayoutModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none h-10 px-4 rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      <Plus size={18} /> {t('add_method')}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {payoutMethods.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{t('no_payout_methods')}</p>
                      </div>
                    ) : (
                      payoutMethods.map((method) => (
                        <div key={method._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-10 bg-white dark:bg-gray-600 border dark:border-gray-500 rounded-lg flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-[10px] uppercase shadow-sm">
                              {method.type === 'bank' ? t('bank_type_label') : t('upi_type_label')}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {method.type === 'bank' ? `${method.bankName} **** ${method.accountNumber?.slice(-4) || '0000'}` : method.upiId}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {method.type === 'bank' ? method.accountHolder : method.accountHolder}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {method.isPrimary && (
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-none text-[10px] font-black uppercase">{t('primary')}</Badge>
                            )}
                            {!method.isPrimary && (
                              <button 
                                onClick={() => handleSetPrimaryPayoutMethod(method._id)}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                              >
                                {t('set_primary')}
                              </button>
                            )}
                            <button 
                              className="p-2 text-gray-300 dark:text-gray-500 hover:text-red-500 transition-colors"
                              onClick={() => {
                                setPayoutMethodToDelete(method);
                                setIsDeletePayoutModalOpen(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Notifications Card */}
                <Card className="p-6 border-none shadow-sm bg-white dark:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <Bell size={24} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('notif_prefs')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('configure_notif_prefs')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { 
                        key: 'orderUpdates', 
                        title: t('notif_order_updates_title'), 
                        desc: t('notif_order_updates_desc'),
                        icon: ShoppingBag
                      },
                      { 
                        key: 'productReviews', 
                        title: t('notif_reviews_title'), 
                        desc: t('notif_reviews_desc'),
                        icon: Star
                      },
                      { 
                        key: 'paymentAlerts', 
                        title: t('notif_payment_title'), 
                        desc: t('notif_payment_desc'),
                        icon: IndianRupee
                      }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                              <Icon size={18} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              const newVal = !notifications[item.key];
                              setNotifications({
                                ...notifications,
                                [item.key]: newVal
                              });
                              try {
                                await updateProfile({ 
                                  notifications: { 
                                    ...notifications, 
                                    [item.key]: newVal 
                                  } 
                                });
                                toast.success(t('notif_pref_updated'));
                              } catch (error) {
                                toast.error(t('err_notif_pref'));
                              }
                            }}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              notifications[item.key] ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              notifications[item.key] ? 'left-7' : 'left-1'
                            }`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Payout Methods Modal */}
              {isPayoutModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[100] p-4 pt-16 pb-8 overflow-y-auto animate-in fade-in duration-300">
                  <Card className="w-full max-w-4xl p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-300 dark:bg-gray-800 my-auto">
                    <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                      <div>
                        <h2 className="text-3xl font-black">Add Payout Method</h2>
                        <p className="text-blue-100 text-base mt-1">Add a new bank account or UPI ID</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setIsPayoutModalOpen(false)} className="text-white hover:bg-white/10 rounded-full">
                        <X size={28} />
                      </Button>
                    </div>
                    <form onSubmit={handleAddPayoutMethod} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setNewPayoutMethod({ ...newPayoutMethod, type: 'bank' })}
                          className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                            newPayoutMethod.type === 'bank' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                              : 'bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <CreditCard size={18} /> Bank Account
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPayoutMethod({ ...newPayoutMethod, type: 'upi' })}
                          className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                            newPayoutMethod.type === 'upi' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                              : 'bg-gray-50 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Smartphone size={18} /> UPI ID
                        </button>
                      </div>

                      {newPayoutMethod.type === 'bank' ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Bank Name</Label>
                            <input 
                              required
                              value={newPayoutMethod.bankName}
                              onChange={(e) => setNewPayoutMethod({...newPayoutMethod, bankName: e.target.value})}
                              placeholder="e.g. HDFC Bank"
                              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium dark:text-white dark:placeholder-gray-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Holder Name</Label>
                            <input 
                              required
                              value={newPayoutMethod.accountHolder}
                              onChange={(e) => setNewPayoutMethod({...newPayoutMethod, accountHolder: e.target.value})}
                              placeholder="Full Name as per Bank"
                              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium dark:text-white dark:placeholder-gray-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Number</Label>
                            <input 
                              required
                              value={newPayoutMethod.accountNumber}
                              onChange={(e) => setNewPayoutMethod({...newPayoutMethod, accountNumber: e.target.value})}
                              placeholder="Enter Account Number"
                              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium dark:text-white dark:placeholder-gray-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Holder Name</Label>
                            <input 
                              required
                              value={newPayoutMethod.accountHolder}
                              onChange={(e) => setNewPayoutMethod({...newPayoutMethod, accountHolder: e.target.value})}
                              placeholder="Full Name"
                              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium dark:text-white dark:placeholder-gray-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">UPI ID</Label>
                            <input 
                              required
                              value={newPayoutMethod.upiId}
                              onChange={(e) => setNewPayoutMethod({...newPayoutMethod, upiId: e.target.value})}
                              placeholder="name@upi"
                              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium dark:text-white dark:placeholder-gray-500"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <input
                          type="checkbox"
                          id="isPrimary"
                          checked={newPayoutMethod.isPrimary}
                          onChange={(e) => setNewPayoutMethod({...newPayoutMethod, isPrimary: e.target.checked})}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <Label htmlFor="isPrimary" className="text-sm font-bold text-gray-700 dark:text-gray-300">Set as primary payout method</Label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700" onClick={() => setIsPayoutModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 dark:shadow-none transition-all">Add Method</Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {/* Edit Profile Modal */}
              {isEditProfileModalOpen && (
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[100] p-4 pt-10 pb-6 overflow-y-auto animate-in fade-in duration-300"
                  onClick={(e) => { if (e.target === e.currentTarget) setIsEditProfileModalOpen(false); }}
                >
                  <Card className="w-full max-w-5xl p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-300 dark:bg-gray-800 my-4 md:my-auto">
                    <div className="bg-green-600 p-6 text-white flex justify-between items-center sticky top-0 z-10">
                      <div>
                        <h2 className="text-3xl font-black">Edit Store Profile</h2>
                        <p className="text-green-100 text-base mt-1">Update your store and contact information</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditProfileModalOpen(false)} className="text-white hover:bg-white/10 rounded-full">
                        <X size={28} />
                      </Button>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            Full Name
                            <span className="text-red-500">*</span>
                          </Label>
                          <input 
                            required
                            value={profileForm.name}
                            onChange={(e) => setProfileForm(prev => ({...prev, name: e.target.value}))}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium dark:text-white dark:placeholder-gray-400"
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            Business Email
                          </Label>
                          <input 
                            type="email"
                            value={profileForm.email}
                            readOnly
                            className="w-full p-3 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl cursor-not-allowed text-gray-600 dark:text-gray-300 font-medium"
                            placeholder="your@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Phone size={14} /> {t('phone_number_label')}
                            <span className="text-red-500">*</span>
                          </Label>
                          <input 
                            type="tel"
                            value={profileForm.phoneNumber}
                            onChange={(e) => setProfileForm(prev => ({...prev, phoneNumber: e.target.value}))}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium dark:text-white dark:placeholder-gray-400"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            Store Name
                            <span className="text-red-500">*</span>
                          </Label>
                          <input 
                            required
                            value={profileForm.storeName}
                            onChange={(e) => setProfileForm(prev => ({...prev, storeName: e.target.value}))}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium dark:text-white dark:placeholder-gray-400"
                            placeholder="Your store name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">Gender</Label>
                          <select
                            value={profileForm.gender}
                            onChange={(e) => setProfileForm(prev => ({...prev, gender: e.target.value}))}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium dark:text-white"
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">Languages Spoken (comma separated)</Label>
                          <input 
                            type="text"
                            value={profileForm.languagesSpoken.join(', ')}
                            onChange={(e) => {
                              const langs = e.target.value.split(',').map(l => l.trim()).filter(l => l);
                              setProfileForm(prev => ({...prev, languagesSpoken: langs}));
                            }}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium dark:text-white dark:placeholder-gray-400"
                            placeholder="e.g., Hindi, English, Punjabi"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            Pincode
                            <span className="text-red-500">*</span>
                          </Label>
                          <input 
                            type="text"
                            value={profileForm.pincode}
                            onChange={(e) => setProfileForm(prev => ({...prev, pincode: e.target.value}))}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium dark:text-white dark:placeholder-gray-400"
                            placeholder="123456"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            City
                            <span className="text-red-500">*</span>
                          </Label>
                          <input 
                            type="text"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm(prev => ({...prev, city: e.target.value}))}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium dark:text-white dark:placeholder-gray-400"
                            placeholder="Your city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            State
                            <span className="text-red-500">*</span>
                          </Label>
                          <input 
                            type="text"
                            value={profileForm.state}
                            onChange={(e) => setProfileForm(prev => ({...prev, state: e.target.value}))}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium dark:text-white dark:placeholder-gray-400"
                            placeholder="Your state"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <MapPin size={14} /> Store Address
                          <span className="text-red-500">*</span>
                        </Label>
                        <textarea 
                          value={profileForm.address}
                          onChange={(e) => setProfileForm(prev => ({...prev, address: e.target.value}))}
                          rows={3}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium resize-none dark:text-white dark:placeholder-gray-400"
                          placeholder="Your complete store address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          Store Description
                          <span className="text-red-500">*</span>
                        </Label>
                        <textarea 
                          value={profileForm.storeDescription}
                          onChange={(e) => setProfileForm(prev => ({...prev, storeDescription: e.target.value}))}
                          rows={4}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium resize-none dark:text-white dark:placeholder-gray-400"
                          placeholder="Tell customers about your store"
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700" onClick={() => setIsEditProfileModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-[2] bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-100 dark:shadow-none transition-all">Save Changes</Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}
              
              {/* Delete Payout Method Modal */}
              {isDeletePayoutModalOpen && payoutMethodToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[100] p-4 pt-16 pb-8 overflow-y-auto animate-in fade-in duration-300">
                  <Card className="w-full max-w-md p-8 text-center border-none shadow-2xl animate-in zoom-in-95 duration-300 dark:bg-gray-800 my-auto">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle size={40} className="text-red-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Delete Payout Method?</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                      Are you sure you want to delete this payout method?
                      <br />
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        {payoutMethodToDelete.type === 'bank' 
                          ? `${payoutMethodToDelete.bankName} **** ${payoutMethodToDelete.accountNumber?.slice(-4) || '0000'}` 
                          : payoutMethodToDelete.upiId}
                      </span>
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                        onClick={() => {
                          setIsDeletePayoutModalOpen(false);
                          setPayoutMethodToDelete(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-100 dark:shadow-none transition-all"
                        onClick={handleRemovePayoutMethod}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-bottom-4 {
          from { transform: translateY(1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom-4;
        }
        .zoom-in-95 {
          animation-name: zoom-in-95;
        }
        /* Custom scrollbar */
        .custom-scrollbar {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #f0fdf4, #ecfeff);
          border-radius: 9999px;
          margin: 4px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #064e3b, #166534);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #22c55e, #10b981);
          border-radius: 9999px;
          border: 3px solid transparent;
          background-clip: padding-box;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #22c55e, #34d399);
          box-shadow: 0 0 14px rgba(34, 197, 94, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #16a34a, #059669);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
          transform: scale(1.05);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4ade80, #6ee7b7);
          box-shadow: 0 0 24px rgba(34, 197, 94, 0.7);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #f0fdf4;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-corner {
          background: #064e3b;
        }
      `}} />
    </div>
  );
}
