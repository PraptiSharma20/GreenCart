/** Helpers to scope vendor API data to the authenticated vendor only */

export const toIdString = (id) => (id == null ? "" : String(id));

export const itemBelongsToVendor = (item, vendorId) =>
  item?.vendor != null && toIdString(item.vendor) === toIdString(vendorId);

export const scopeOrderForVendor = (order, vendorId) => {
  const doc = order.toObject ? order.toObject() : { ...order };
  const items = (doc.items || []).filter((item) => itemBelongsToVendor(item, vendorId));
  const vendorSubtotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  return { ...doc, items, vendorSubtotal };
};

export const stripProductOwnershipFields = (body = {}) => {
  const safe = { ...body };
  delete safe.vendor;
  delete safe.ratings;
  delete safe.rating;
  delete safe.reviews;
  return safe;
};
