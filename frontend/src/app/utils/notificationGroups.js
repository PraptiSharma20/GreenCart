const DISMISSED_GROUPS_KEY = 'gc_notif_dismissed_groups';

export function toIdString(id) {
  if (!id) return '';
  if (typeof id === 'object' && id._id) return String(id._id);
  return String(id);
}

/** Mirrors backend getNotificationGroupKey */
export function getNotificationGroupKey(doc) {
  const userId = toIdString(doc.userId);
  const orderId = toIdString(doc.orderId);
  const productId = toIdString(doc.productId);
  const type = doc.type || '';
  const title = (doc.title || '').trim().toLowerCase();

  switch (type) {
    case 'order_update':
    case 'payment_alert':
      return `${userId}|${type}|${orderId}|${title}`;
    case 'order_cancelled':
    case 'order_return_requested':
    case 'order_cancelled_by_vendor':
    case 'refund_successful':
    case 'review_request':
      return `${userId}|${type}|${orderId}`;
    case 'product_review':
    case 'vendor_thanks':
      return `${userId}|${type}|${orderId}|${productId}`;
    case 'support_reply':
      return `${userId}|${type}|${title}`;
    default:
      return `${userId}|${type}|${orderId}|${productId}|${title}`;
  }
}

function loadDismissedGroups() {
  try {
    const raw = sessionStorage.getItem(DISMISSED_GROUPS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveDismissedGroups(set) {
  try {
    sessionStorage.setItem(DISMISSED_GROUPS_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore quota errors */
  }
}

export function rememberDismissedGroup(notification) {
  const set = loadDismissedGroups();
  set.add(getNotificationGroupKey(notification));
  saveDismissedGroups(set);
}

export function clearDismissedGroup(notification) {
  const set = loadDismissedGroups();
  set.delete(getNotificationGroupKey(notification));
  saveDismissedGroups(set);
}

export function isGroupDismissedInSession(notification) {
  return loadDismissedGroups().has(getNotificationGroupKey(notification));
}

/** Mark one notification read; backend marks the whole duplicate group. */
export async function markNotificationGroupRead(api, notification) {
  await api.auth.markNotificationRead(notification._id);
  clearDismissedGroup(notification);
}

export function countUnread(notifications) {
  return notifications.filter((n) => !n.read).length;
}
