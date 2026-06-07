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

export function VendorNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [latestNotification, setLatestNotification] = useState(null);

  const refreshToast = useCallback(async () => {
    if (!user || user.role !== "vendor") {
      setLatestNotification(null);
      return;
    }
    try {
      const notifications = await api.auth.getNotifications();
      const relevant = pickRelevantUnreadNotification(notifications, {
        excludeTypes: ["vendor_thanks"],
      });
      setLatestNotification(relevant || null);
    } catch (error) {
      console.error("Failed to fetch notifications for toast:", error);
    }
  }, [user]);

  useEffect(() => {
    refreshToast();
    const id = setInterval(refreshToast, 20000);
    return () => clearInterval(id);
  }, [refreshToast]);

  if (!user || user.role !== "vendor" || !latestNotification) return null;

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
      const type = latestNotification.type;
      setLatestNotification(null);

      if (type === "support_reply") {
        navigate("/contact");
      } else if (type === "product_review") {
        navigate("/vendor/dashboard?tab=reviews");
      } else if (
        type === "order_cancelled" ||
        type === "order_return_requested" ||
        type === "order_update" ||
        latestNotification.orderId
      ) {
        navigate("/vendor/dashboard?tab=orders");
      } else {
        navigate("/vendor/dashboard");
      }
      await refreshToast();
    } catch (error) {
      console.error("Failed to open notification:", error);
    }
  };

  let NotificationIcon = ShoppingBag;
  let headerBg = "from-green-500 to-emerald-600";
  if (
    latestNotification.type === "order_cancelled" ||
    latestNotification.type === "order_return_requested"
  ) {
    NotificationIcon = ShoppingBag;
    headerBg = "from-orange-500 to-red-600";
  } else if (latestNotification.type === "product_review") {
    NotificationIcon = Star;
    headerBg = "from-yellow-500 to-amber-600";
  } else if (latestNotification.type === "payment_alert") {
    NotificationIcon = IndianRupee;
    headerBg = "from-blue-500 to-indigo-600";
  } else if (latestNotification.type === "support_reply") {
    NotificationIcon = MessageSquare;
    headerBg = "from-emerald-500 to-teal-600";
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <Card className="p-0 shadow-2xl border-0 overflow-hidden bg-white dark:bg-gray-800 animate-in fade-in slide-in-from-bottom-8 slide-in-from-right-4 duration-500 w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-3xl">
        <div className={`p-6 bg-gradient-to-r ${headerBg} text-white`}>
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
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-12 rounded-2xl shadow-lg shadow-green-200 dark:shadow-none transition-all"
              onClick={viewDetails}
            >
              View Details
            </Button>
            <Button
              type="button"
              variant="outline"
              className="font-bold h-12 rounded-2xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              onClick={dismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
