const ONLINE_METHODS = new Set(['card', 'online', 'razorpay', 'upi', 'netbanking']);
const COD_METHODS = new Set(['cod', 'cash on delivery', 'cash']);

/** Manual vendor refund (not return approval) — prepaid orders cancelled before fulfilment */
const MANUAL_REFUND_STATUSES = new Set(['Cancelled']);

export function normalizePaymentMethod(paymentMethod = '') {
  return String(paymentMethod).trim().toLowerCase();
}

export function isOnlinePayment(paymentMethod) {
  const m = normalizePaymentMethod(paymentMethod);
  return ONLINE_METHODS.has(m) || m.includes('card') || m.includes('razorpay');
}

export function isCodPayment(paymentMethod) {
  const m = normalizePaymentMethod(paymentMethod);
  if (COD_METHODS.has(m)) return true;
  return m.includes('cod') || m.includes('cash');
}

export function getPaymentLabelKey(paymentMethod) {
  return isOnlinePayment(paymentMethod) ? 'payment_online' : 'payment_cod';
}

export function canVendorProcessOnlineRefund(order) {
  if (!isOnlinePayment(order?.paymentMethod)) {
    return {
      allowed: false,
      reasonKey: 'refund_blocked_cod',
    };
  }
  if (order?.status === 'Delivered') {
    return {
      allowed: false,
      reasonKey: 'refund_blocked_no_return',
    };
  }
  if (MANUAL_REFUND_STATUSES.has(order?.status)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reasonKey: 'refund_blocked_online',
  };
}

export function shouldShowVendorRefundButton(order) {
  if (order.status === 'Refunded' || order.status === 'Return Requested') {
    return false;
  }
  if (!isOnlinePayment(order?.paymentMethod)) {
    return false;
  }
  return order.status === 'Cancelled';
}
