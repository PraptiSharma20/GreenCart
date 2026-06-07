import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { useLang } from '../context/language';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ShoppingBag, Star, IndianRupee, ArrowLeft, Bell, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { collapseNotificationsForDisplay } from '../utils/notificationUtils';

export function VendorNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.auth.getNotifications();
      setNotifications(collapseNotificationsForDisplay(data));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await api.auth.markNotificationRead(id);
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.auth.markAllNotificationsRead();
      await fetchNotifications();
      toast.success("All notifications marked as read!");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    if (notification.type === 'support_reply') {
      navigate('/contact');
    } else if (notification.type === 'product_review') {
      navigate('/vendor/dashboard?tab=reviews');
    } else if (notification.orderId) {
      navigate('/vendor/dashboard?tab=orders');
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Get notification icon and styling
  const getNotificationStyle = (notification) => {
    let icon = ShoppingBag;
    let iconBg = "from-green-500 to-emerald-600";

    if (notification.type === "product_review") {
      icon = Star;
      iconBg = "from-yellow-500 to-amber-600";
    } else if (notification.type === "payment_alert") {
      icon = IndianRupee;
      iconBg = "from-blue-500 to-indigo-600";
    }

    return { icon: icon, bg: iconBg };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/vendor/dashboard')}
              className="rounded-full"
            >
              <ArrowLeft size={24} />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {notifications.filter(n => !n.read).length > 0 
                  ? `You have ${notifications.filter(n => !n.read).length} new notifications` 
                  : "No new notifications"}
              </p>
            </div>
            {notifications.some(n => !n.read) && (
              <Button onClick={markAllAsRead} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                Mark All as Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={48} className="animate-spin text-green-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mb-6">
              <Bell size={48} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Notifications</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              You're all caught up! New notifications will appear here when customers place orders, leave reviews, or complete payments.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {notifications.map((notification) => {
              const { icon: NotificationIcon, bg } = getNotificationStyle(notification);
              return (
                <Card 
                  key={notification._id} 
                  className={`overflow-hidden transition-all duration-300 group cursor-pointer ${
                    !notification.read 
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-l-4 border-l-green-600" 
                      : "border-l-4 border-l-gray-300 dark:border-l-gray-600"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-5">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <NotificationIcon size={32} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className={`font-black text-xl ${
                              notification.read 
                                ? "text-gray-700 dark:text-gray-300" 
                                : "text-gray-900 dark:text-white"
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 border-none">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {new Date(notification.createdAt).toLocaleString([], { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
