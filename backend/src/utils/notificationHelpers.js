import Notification from "../models/Notification.js";

const ORDER_STATUS_RANK = {
  Pending: 0,
  Accepted: 1,
  Preparing: 1,
  Shipped: 2,
  "Out for Delivery": 2,
  Delivered: 3,
  "Return Requested": 4,
  Cancelled: 5,
  Refunded: 5,
};

/** One in-app notification per logical event (per user) */
const SINGLETON_PER_ORDER_TYPES = new Set([
  "review_request",
  "refund_successful",
  "order_cancelled_by_vendor",
  "order_return_requested",
  "order_cancelled",
]);

export function toIdString(id) {
  if (!id) return "";
  return id._id?.toString?.() || id.toString();
}

export function getNotificationGroupKey(doc) {
  const userId = toIdString(doc.userId);
  const orderId = toIdString(doc.orderId);
  const productId = toIdString(doc.productId);
  const type = doc.type || "";
  const title = (doc.title || "").trim().toLowerCase();

  switch (type) {
    case "order_update":
    case "payment_alert":
      return `${userId}|${type}|${orderId}|${title}`;
    case "order_cancelled":
    case "order_return_requested":
    case "order_cancelled_by_vendor":
    case "refund_successful":
    case "review_request":
      return `${userId}|${type}|${orderId}`;
    case "product_review":
    case "vendor_thanks":
      return `${userId}|${type}|${orderId}|${productId}`;
    case "support_reply":
      return `${userId}|${type}|${title}`;
    default:
      return `${userId}|${type}|${orderId}|${productId}|${title}`;
  }
}

/** Map notification title to the order status it describes */
export function getNotificationStatusRank(title = "") {
  const t = title.toLowerCase();
  if (t.includes("accepted")) return 1;
  if (t.includes("out for delivery")) return 2;
  if (t.includes("delivered")) return 3;
  if (t.includes("refunded")) return 5;
  if (t.includes("cancelled") || t.includes("canceled")) return 5;
  if (t.includes("return")) return 4;
  return 0;
}

export function getOrderStatusRank(status = "") {
  return ORDER_STATUS_RANK[status] ?? 0;
}

/** True when the order has moved past what this notification describes */
export function isStaleOrderUpdateNotification(notification, orderStatus) {
  if (notification.type !== "order_update" || !orderStatus) return false;
  const notifRank = getNotificationStatusRank(notification.title);
  const orderRank = getOrderStatusRank(orderStatus);
  return orderRank > notifRank;
}

export async function markSupersededOrderNotificationsRead(userId, orderId) {
  if (!userId || !orderId) return;
  await Notification.updateMany(
    {
      userId,
      orderId,
      type: { $in: ["order_update", "order_cancelled_by_vendor"] },
      read: false,
    },
    { read: true }
  );
}

export async function markStaleOrderNotificationsRead(notifications) {
  const staleIds = [];
  for (const n of notifications) {
    const order = n.orderId;
    const status =
      order && typeof order === "object" && order.status ? order.status : null;
    if (!n.read && status && isStaleOrderUpdateNotification(n, status)) {
      staleIds.push(n._id);
      n.read = true;
    }
  }
  if (staleIds.length > 0) {
    await Notification.updateMany({ _id: { $in: staleIds } }, { read: true });
  }
}

/** Mark older duplicate unread rows in the same group as read (keeps newest). */
export async function deduplicateUnreadNotifications(userId) {
  const uid = toIdString(userId);
  const unread = await Notification.find({ userId: uid, read: false }).sort({
    createdAt: -1,
  });

  const groups = new Map();
  for (const n of unread) {
    const key = getNotificationGroupKey(n);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(n);
  }

  const duplicateIds = [];
  for (const list of groups.values()) {
    if (list.length <= 1) continue;
    for (let i = 1; i < list.length; i++) {
      duplicateIds.push(list[i]._id);
    }
  }

  if (duplicateIds.length > 0) {
    await Notification.updateMany(
      { _id: { $in: duplicateIds } },
      { read: true }
    );
  }

  return duplicateIds.length;
}

export async function markNotificationGroupRead(notification) {
  if (!notification) return 0;
  const uid = toIdString(notification.userId);
  const groupKey = getNotificationGroupKey(notification);

  const unread = await Notification.find({ userId: uid, read: false });
  const ids = unread
    .filter((n) => getNotificationGroupKey(n) === groupKey)
    .map((n) => n._id);

  if (ids.length > 0) {
    await Notification.updateMany({ _id: { $in: ids } }, { read: true });
  }

  return ids.length;
}

export async function createNotification(
  userId,
  type,
  title,
  message,
  orderId = null,
  productId = null
) {
  try {
    const uid = toIdString(userId);
    const oid = orderId ? toIdString(orderId) : null;
    const pid = productId ? toIdString(productId) : null;

    if (
      (type === "order_update" || type === "order_cancelled_by_vendor") &&
      oid
    ) {
      await markSupersededOrderNotificationsRead(uid, oid);
    }

    const baseQuery = { userId: uid, type, title };
    if (oid) baseQuery.orderId = oid;
    if (pid) baseQuery.productId = pid;

    const duplicateUnread = await Notification.findOne({
      ...baseQuery,
      read: false,
    });
    if (duplicateUnread) {
      duplicateUnread.message = message;
      await duplicateUnread.save();
      return duplicateUnread;
    }

    if (SINGLETON_PER_ORDER_TYPES.has(type) && oid) {
      const existing = await Notification.findOne({
        userId: uid,
        type,
        orderId: oid,
      });
      if (existing) {
        if (!existing.read) {
          existing.title = title;
          existing.message = message;
          await existing.save();
        }
        return existing;
      }
    }

    return await Notification.create({
      userId: uid,
      type,
      title,
      message,
      orderId: oid,
      productId: pid,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}
