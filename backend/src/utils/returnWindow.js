export const RETURN_WINDOW_HOURS = 24;

export function getDeliveredAt(order) {
  if (!order) return null;
  if (order.deliveredAt) return new Date(order.deliveredAt);
  if (order.status?.toLowerCase() === "delivered") {
    return new Date(order.updatedAt || order.createdAt);
  }
  return null;
}

export function getReturnDeadline(order) {
  const deliveredAt = getDeliveredAt(order);
  if (!deliveredAt) return null;
  return new Date(deliveredAt.getTime() + RETURN_WINDOW_HOURS * 60 * 60 * 1000);
}

export function isWithinReturnWindow(order) {
  if (order?.status?.toLowerCase() !== "delivered") return false;
  const deadline = getReturnDeadline(order);
  if (!deadline) return false;
  return Date.now() <= deadline.getTime();
}
