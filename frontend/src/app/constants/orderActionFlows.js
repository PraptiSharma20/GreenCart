export const CANCEL_REASONS = [
  { code: "mistake", label: "I ordered by mistake" },
  { code: "better_price", label: "Found a better price elsewhere" },
  { code: "slow_delivery", label: "Delivery is taking too long" },
  { code: "wrong_address", label: "Wrong delivery address" },
  { code: "changed_mind", label: "Changed my mind" },
  { code: "duplicate", label: "Duplicate order" },
  { code: "other", label: "Other reason" },
];

export const RETURN_REASONS = [
  { code: "not_fresh", label: "Product not fresh / poor quality" },
  { code: "wrong_item", label: "Received wrong item" },
  { code: "damaged", label: "Damaged during delivery" },
  { code: "missing_items", label: "Items missing from order" },
  { code: "expired", label: "Product near expiry or spoiled" },
  { code: "not_as_described", label: "Not as described on the app" },
  { code: "other", label: "Other reason" },
];

export const CANCEL_FOLLOW_UP = [
  {
    id: "confirm_cancel",
    question: "Are you sure you want to cancel this order?",
    type: "choice",
    options: ["Yes, cancel my order", "No, keep my order"],
    required: true,
  },
  {
    id: "notify_vendor",
    question: "Should we notify the vendor about this cancellation?",
    type: "choice",
    options: ["Yes", "No"],
    required: true,
  },
  {
    id: "experience",
    question: "How was your ordering experience so far?",
    type: "choice",
    options: ["Good", "Average", "Poor"],
    required: true,
  },
];

export const RETURN_FOLLOW_UP = [
  {
    id: "issue_detail",
    question: "Please describe the issue with your order",
    type: "text",
    placeholder: "E.g. vegetables were wilted, packaging was torn...",
    required: true,
  },
  {
    id: "product_used",
    question: "Have you used or consumed any part of this order?",
    type: "choice",
    options: ["No, unused", "Yes, partially used", "Yes, fully used"],
    required: true,
  },
  {
    id: "pickup_preference",
    question: "How should we collect the return?",
    type: "choice",
    options: [
      "Pickup from my address",
      "I will drop at nearest collection point",
      "No pickup needed (quality issue only)",
    ],
    required: true,
  },
  {
    id: "refund_method",
    question: "Preferred refund method",
    type: "choice",
    options: [
      "Original payment method",
      "GreenCart wallet / store credit",
      "Bank transfer (UPI)",
    ],
    required: true,
  },
];
