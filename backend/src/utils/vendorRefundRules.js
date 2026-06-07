const ONLINE_METHODS = new Set(["card", "online", "razorpay", "upi", "netbanking"]);
const MANUAL_REFUND_STATUSES = new Set(["Cancelled"]);

function normalizePaymentMethod(paymentMethod = "") {
  return String(paymentMethod).trim().toLowerCase();
}

export function isOnlinePayment(paymentMethod) {
  const m = normalizePaymentMethod(paymentMethod);
  return ONLINE_METHODS.has(m) || m.includes("card") || m.includes("razorpay");
}

export function validateVendorRefund(order) {
  if (!isOnlinePayment(order.paymentMethod)) {
    return {
      allowed: false,
      message:
        "Cash on Delivery orders cannot be refunded here. Payment is collected at delivery—use order status or approve customer returns.",
    };
  }
  if (order.status === "Delivered") {
    return {
      allowed: false,
      message:
        "This order was delivered without a return. Ask the customer to submit a return request, then use Approve return to process the refund.",
    };
  }
  if (!MANUAL_REFUND_STATUSES.has(order.status)) {
    return {
      allowed: false,
      message:
        "Manual refunds are only for cancelled prepaid orders. For returns, use Approve return when the customer submits a return request.",
    };
  }
  return { allowed: true };
}
