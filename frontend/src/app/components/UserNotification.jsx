import { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { ShoppingBag, Star, IndianRupee, X, MessageSquare } from "lucide-react";
import { pickRelevantUnreadNotification } from "../utils/notificationUtils";
import {
  markNotificationGroupRead,
  rememberDismissedGroup,
} from "../utils/notificationGroups";

export function UserNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [latestNotification, setLatestNotification] = useState(null);

  const refreshToast = useCallback(async () => {
    if (!user || user.role === "vendor" || user.role === "admin") {
      setLatestNotification(null);
      return;
    }
    try {
      const notifications = await api.auth.getNotifications();
      const relevant = pickRelevantUnreadNotification(notifications);
      setLatestNotification(relevant || null);
    } catch (error) {
      console.error("Failed to fetch notifications for user toast:", error);
    }
  }, [user]);

  useEffect(() => {
    refreshToast();
    const id = setInterval(refreshToast, 20000);
    return () => clearInterval(id);
  }, [refreshToast]);

  if (!user || !latestNotification) return null;

  const dismiss = async () => {
    try {
      rememberDismissedGroup(latestNotification);
      await markNotificationGroupRead(api, latestNotification);
      setLatestNotification(null);
      await refreshToast();
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  const viewDetails = async () => {
    try {
      await markNotificationGroupRead(api, latestNotification);
      const n = latestNotification;
      setLatestNotification(null);

      if (n.type === "support_reply") {
        navigate("/contact");
      } else if (n.type === "vendor_thanks") {
        const pid = n.productId?._id || n.productId;
        if (pid) navigate(`/product/${pid}`);
        else navigate("/orders");
      } else if (
        n.type === "review_request" ||
        n.type === "order_cancelled_by_vendor" ||
        n.orderId
      ) {
        const oid = n.orderId?._id || n.orderId;
        navigate(oid ? `/orders?highlight=${oid}` : "/orders");
      } else if (n.productId) {
        const pid = n.productId?._id || n.productId;
        navigate(`/product/${pid}`);
      }
      await refreshToast();
    } catch (error) {
      console.error("Failed to view details:", error);
    }
  };

  let NotificationIcon = ShoppingBag;
  let headerGradient = "from-blue-500 to-indigo-600";
  if (
    latestNotification.type === "product_review" ||
    latestNotification.type === "review_request"
  ) {
    NotificationIcon = Star;
    headerGradient = "from-yellow-500 to-amber-600";
  } else if (latestNotification.type === "vendor_thanks") {
    NotificationIcon = Star;
    headerGradient = "from-green-500 to-emerald-600";
  } else if (latestNotification.type === "refund_successful") {
    NotificationIcon = IndianRupee;
    headerGradient = "from-green-500 to-emerald-600";
  } else if (latestNotification.type === "payment_alert") {
    NotificationIcon = IndianRupee;
    headerGradient = "from-green-500 to-emerald-600";
  } else if (latestNotification.type === "order_cancelled_by_vendor") {
    NotificationIcon = ShoppingBag;
    headerGradient = "from-rose-500 to-red-600";
  } else if (latestNotification.type === "support_reply") {
    NotificationIcon = MessageSquare;
    headerGradient = "from-emerald-500 to-teal-600";
  }

  return (
    <div className="fixed bottom-6 left-6 z-[9999]">
      <Card className="p-0 shadow-2xl border-0 overflow-hidden bg-white dark:bg-gray-800 animate-in fade-in slide-in-from-bottom-8 slide-in-from-left-4 duration-500 w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-3xl">
        <div className={`p-6 text-white bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <NotificationIcon size={24} className="text-white" />
              </div>
              <div>
                <p className="font-black text-lg">{latestNotification.title}</p>
                <p className="text-xs text-white/80">New Notification</p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all"
              aria-label="Dismiss"
            >
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-4">
            {latestNotification.message}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={viewDetails}
              className={`flex-1 text-white font-bold h-12 rounded-2xl shadow-lg transition-all ${
                latestNotification.type === "review_request"
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
                  : latestNotification.type === "vendor_thanks"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200 dark:shadow-none"
              }`}
            >
              {latestNotification.type === "review_request"
                ? "Rate on Orders"
                : latestNotification.type === "vendor_thanks"
                  ? "View Product"
                  : "View Details"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={dismiss}
              className="font-bold h-12 rounded-2xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
