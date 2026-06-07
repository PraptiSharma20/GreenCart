export const VENDOR_STATUS_FLOW = [
  "Pending",
  "Accepted",
  "Out for Delivery",
  "Delivered",
];

export const VENDOR_ALLOWED_STATUSES = [
  ...VENDOR_STATUS_FLOW,
  "Cancelled",
];

const LEGACY_STATUS_MAP = {
  Preparing: "Accepted",
  Shipped: "Out for Delivery",
};

const LOCKED_STATUSES = [
  "Delivered",
  "Cancelled",
  "Refunded",
  "Return Requested",
];

function normalizeStatus(status) {
  return LEGACY_STATUS_MAP[status] || status;
}

export function isValidVendorStatusTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  if (LOCKED_STATUSES.includes(fromStatus)) return false;
  if (toStatus === "Cancelled") {
    return !LOCKED_STATUSES.includes(fromStatus);
  }
  if (!VENDOR_STATUS_FLOW.includes(toStatus)) return false;

  const fromIndex = VENDOR_STATUS_FLOW.indexOf(normalizeStatus(fromStatus));
  const toIndex = VENDOR_STATUS_FLOW.indexOf(toStatus);
  if (fromIndex === -1 || toIndex === -1) return false;

  return toIndex === fromIndex + 1;
}
