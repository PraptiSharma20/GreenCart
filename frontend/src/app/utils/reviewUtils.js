export function getProductId(product) {
  if (!product) return null;
  return String(product._id || product.id || product);
}

/** Auth user from API uses `id`; some docs use `_id`. */
export function getAuthUserId(user) {
  if (!user) return null;
  const uid = user._id || user.id;
  return uid ? String(uid) : null;
}

export function getUserRatingOnProduct(product, userId) {
  if (!product?.ratings || !userId) return null;
  return product.ratings.find(
    (r) => String(r.user?._id || r.user) === String(userId)
  );
}

/** Rating for a specific delivered order (same product can be rated per order). */
export function getUserRatingOnOrder(product, userId, orderId) {
  if (!product?.ratings || !userId || !orderId) return null;
  const oid = String(orderId);
  return product.ratings.find(
    (r) =>
      String(r.user?._id || r.user) === String(userId) &&
      String(r.orderId?._id || r.orderId || '') === oid
  );
}

export function isProductReviewedOnOrder(order, productId) {
  const pid = String(productId);
  return (order.reviewedProductIds || []).some((id) => String(id) === pid);
}

/** Whether customer can still rate this line item on the orders page. */
export function orderItemNeedsReview(order, product, userOrId) {
  const userId =
    typeof userOrId === 'object' ? getAuthUserId(userOrId) : userOrId ? String(userOrId) : null;
  if (!userId || order?.status?.toLowerCase() !== 'delivered') return false;
  const pid = getProductId(product);
  if (!pid) return false;
  const orderId = order._id || order.id;
  if (getUserRatingOnOrder(product, userId, orderId)) return false;
  return true;
}
