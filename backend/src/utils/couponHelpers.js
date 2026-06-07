/** Shared filters for coupons customers can use */
export function buildActiveCouponsFilter(now = new Date()) {
  return {
    status: { $in: ["active", "pending"] },
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $or: [
      { usageLimit: null },
      { usageLimit: 0 },
      { $expr: { $and: [{ $gt: ["$usageLimit", 0] }, { $lt: ["$usageCount", "$usageLimit"] }] } },
    ],
  };
}

export function isCouponCurrentlyValid(coupon, now = new Date()) {
  if (!coupon) return false;
  if (!["active", "pending"].includes(coupon.status)) return false;
  const from = new Date(coupon.validFrom);
  const until = new Date(coupon.validUntil);
  if (from > now || until < now) return false;
  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) return false;
  return true;
}
