export const RETURN_WINDOW_HOURS = 24;

const CANCELLABLE = ['pending', 'accepted', 'preparing'];

export function getDeliveredAt(order) {
  if (!order) return null;
  if (order.deliveredAt) return new Date(order.deliveredAt);
  if (order.status?.toLowerCase() === 'delivered') {
    return new Date(order.updatedAt || order.createdAt);
  }
  return null;
}

export function getReturnWindowInfo(order) {
  if (order?.status?.toLowerCase() !== 'delivered') {
    return { open: false, expired: false, deliveredAt: null, deadline: null };
  }

  const deliveredAt = getDeliveredAt(order);
  if (!deliveredAt) {
    return { open: false, expired: false, deliveredAt: null, deadline: null };
  }

  const deadline = new Date(
    deliveredAt.getTime() + RETURN_WINDOW_HOURS * 60 * 60 * 1000
  );
  const remaining = deadline.getTime() - Date.now();

  if (remaining <= 0) {
    return { open: false, expired: true, deliveredAt, deadline };
  }

  const hoursLeft = Math.floor(remaining / (1000 * 60 * 60));
  const minutesLeft = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return {
    open: true,
    expired: false,
    deliveredAt,
    deadline,
    hoursLeft,
    minutesLeft,
    totalMinutesLeft: Math.ceil(remaining / (1000 * 60)),
  };
}

export function canCancelOrder(order) {
  return CANCELLABLE.includes(order?.status?.toLowerCase());
}

export function canReturnOrder(order) {
  if (order?.status?.toLowerCase() !== 'delivered') return false;
  return getReturnWindowInfo(order).open;
}

export function isReturnPending(order) {
  return order?.status?.toLowerCase() === 'return requested';
}

export function showRefundUi(order) {
  const s = order?.status?.toLowerCase();
  return s === 'refunded' || (s === 'cancelled' && order?.refundedAt);
}

export function isOrderDelivered(order) {
  return order?.status?.toLowerCase() === 'delivered';
}
