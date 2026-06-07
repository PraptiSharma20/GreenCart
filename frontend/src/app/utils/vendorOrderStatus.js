/** Linear fulfillment flow shown to customers when tracking orders */
export const VENDOR_STATUS_FLOW = [
  'Pending',
  'Accepted',
  'Out for Delivery',
  'Delivered',
];

export const VENDOR_DROPDOWN_STATUSES = [
  ...VENDOR_STATUS_FLOW,
  'Cancelled',
];

const LEGACY_STATUS_MAP = {
  Preparing: 'Accepted',
  Shipped: 'Out for Delivery',
};

const LOCKED_STATUSES = [
  'Delivered',
  'Cancelled',
  'Refunded',
  'Return Requested',
];

export function normalizeVendorStatus(status) {
  return LEGACY_STATUS_MAP[status] || status;
}

export function isVendorStatusLocked(status) {
  return LOCKED_STATUSES.includes(status);
}

export function isDeliveryPartnerConfirmed(order) {
  return Boolean(order?.deliveryAssignment?.partnerReportedAt);
}

export function needsDeliveryDispatch(order) {
  const normalized = normalizeVendorStatus(order?.status);
  return normalized === 'Accepted' || order?.status === 'Accepted';
}

/** Options the vendor may pick: current, next step forward, or cancel */
export function getVendorSelectableStatuses(status, order = null) {
  if (isVendorStatusLocked(status)) {
    return [status];
  }

  const options = [status];
  const normalized = normalizeVendorStatus(status);
  const flowIndex = VENDOR_STATUS_FLOW.indexOf(normalized);

  if (flowIndex >= 0 && flowIndex < VENDOR_STATUS_FLOW.length - 1) {
    options.push(VENDOR_STATUS_FLOW[flowIndex + 1]);
  }

  if (status !== 'Cancelled') {
    options.push('Cancelled');
  }

  let result = [...new Set(options)];

  if (
    order &&
    normalizeVendorStatus(order.status) === 'Out for Delivery' &&
    !isDeliveryPartnerConfirmed(order)
  ) {
    result = result.filter((s) => s !== 'Delivered');
  }

  return result;
}

export function isValidVendorStatusTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  if (isVendorStatusLocked(fromStatus)) return false;
  if (toStatus === 'Cancelled') {
    return !LOCKED_STATUSES.includes(fromStatus);
  }
  if (!VENDOR_STATUS_FLOW.includes(toStatus)) return false;

  const fromIndex = VENDOR_STATUS_FLOW.indexOf(normalizeVendorStatus(fromStatus));
  const toIndex = VENDOR_STATUS_FLOW.indexOf(toStatus);
  if (fromIndex === -1 || toIndex === -1) return false;

  return toIndex === fromIndex + 1;
}
