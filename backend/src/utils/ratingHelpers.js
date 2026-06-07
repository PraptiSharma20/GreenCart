import User from "../models/User.js";

/** User IDs that must never appear as product reviewers (vendors, admins). */
export async function getBlockedReviewerIds() {
  const users = await User.find({ role: { $in: ["vendor", "admin"] } }).select("_id");
  return new Set(users.map((u) => u._id.toString()));
}

export function recalculateRatingStats(ratings = []) {
  if (!ratings.length) {
    return { rating: 0, reviews: 0 };
  }
  const total = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
  return {
    rating: total / ratings.length,
    reviews: ratings.length,
  };
}

/** Remove vendor/admin ratings from a product payload and fix averages. */
export function sanitizeProductRatings(product, blockedIds) {
  if (!product) return product;
  const doc = product.toObject ? product.toObject() : { ...product };
  const valid = (doc.ratings || []).filter(
    (r) => !blockedIds.has(String(r.user?._id || r.user))
  );
  const stats = recalculateRatingStats(valid);
  return { ...doc, ratings: valid, rating: stats.rating, reviews: stats.reviews };
}

export async function sanitizeProductsList(products) {
  const blockedIds = await getBlockedReviewerIds();
  return products.map((p) => sanitizeProductRatings(p, blockedIds));
}
