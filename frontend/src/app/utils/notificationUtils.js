import {
  getNotificationGroupKey,
  isGroupDismissedInSession,
} from './notificationGroups';

const ORDER_STATUS_RANK = {
  Pending: 0,
  Accepted: 1,
  Preparing: 1,
  Shipped: 2,
  'Out for Delivery': 2,
  Delivered: 3,
  'Return Requested': 4,
  Cancelled: 5,
  Refunded: 5,
};

export function getNotificationStatusRank(title = '') {
  const t = title.toLowerCase();
  if (t.includes('accepted')) return 1;
  if (t.includes('out for delivery')) return 2;
  if (t.includes('delivered')) return 3;
  if (t.includes('refunded')) return 5;
  if (t.includes('cancelled') || t.includes('canceled')) return 5;
  if (t.includes('return')) return 4;
  return 0;
}

export function getOrderStatusRank(status = '') {
  return ORDER_STATUS_RANK[status] ?? 0;
}

export function isStaleOrderUpdateNotification(notification, orderStatus) {
  if (notification.type !== 'order_update' || !orderStatus) return false;
  return (
    getOrderStatusRank(orderStatus) >
    getNotificationStatusRank(notification.title)
  );
}

export function getOrderStatusFromNotification(notification) {
  const order = notification.orderId;
  if (order && typeof order === 'object' && order.status) {
    return order.status;
  }
  return null;
}

/** Newest unread that is still relevant and not dismissed this session */
export function pickRelevantUnreadNotification(notifications, options = {}) {
  const { excludeTypes = [] } = options;
  const seenGroups = new Set();

  return notifications.find((n) => {
    if (n.read) return false;
    if (excludeTypes.includes(n.type)) return false;

    const orderStatus = getOrderStatusFromNotification(n);
    if (orderStatus && isStaleOrderUpdateNotification(n, orderStatus)) {
      return false;
    }

    if (isGroupDismissedInSession(n)) {
      return false;
    }

    const groupKey = getNotificationGroupKey(n);
    if (seenGroups.has(groupKey)) {
      return false;
    }
    seenGroups.add(groupKey);

    return true;
  });
}

/** Collapse list for bell badge / panel (one row per logical event) */
export function collapseNotificationsForDisplay(notifications) {
  const byKey = new Map();
  for (const n of notifications) {
    const key = getNotificationGroupKey(n);
    const prev = byKey.get(key);
    if (!prev || new Date(n.createdAt) > new Date(prev.createdAt)) {
      byKey.set(key, n);
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}
