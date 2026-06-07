const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("gc_token");
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // If Content-Type is explicitly undefined, remove it (for FormData)
  if (headers["Content-Type"] === undefined) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data.message || "Something went wrong";
    if (
      response.status === 401 &&
      token &&
      /token invalid|not authorized|unauthorized/i.test(message)
    ) {
      localStorage.removeItem("gc_token");
      localStorage.removeItem("gc_user");
      window.dispatchEvent(new CustomEvent("gc:auth-expired"));
    }
    throw new Error(message);
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) =>
      request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    getProfile: () => request("/auth/profile"),
    updateProfile: (data) =>
      request("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    toggleWishlist: (productId) =>
      request("/auth/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId }),
      }),
    getWishlist: () => request("/auth/wishlist"),
    addPayoutMethod: (method) =>
      request("/auth/payout", {
        method: "POST",
        body: JSON.stringify(method),
      }),
    removePayoutMethod: (methodId) =>
      request("/auth/payout", {
        method: "DELETE",
        body: JSON.stringify({ methodId }),
      }),
    setPrimaryPayoutMethod: (methodId) =>
      request("/auth/payout/primary", {
        method: "PUT",
        body: JSON.stringify({ methodId }),
      }),
    getNotifications: () => request("/auth/notifications"),
    markNotificationRead: (id) =>
      request(`/auth/notifications/${id}/read`, { method: "PUT" }),
    markAllNotificationsRead: () =>
      request("/auth/notifications/mark-all-read", { method: "PUT" }),
  },
  products: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      const lang = localStorage.getItem("gc_lang");
      if (lang && lang !== "en") params.append("lang", lang);
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      return request(`/products${params.toString() ? `?${params.toString()}` : ""}`);
    },
    getById: (id) => {
      const lang = localStorage.getItem("gc_lang");
      const qs = lang && lang !== "en" ? `?lang=${lang}` : "";
      return request(`/products/${id}${qs}`);
    },
    create: (productData) =>
      request("/products", {
        method: "POST",
        body: JSON.stringify(productData),
      }),
    update: (id, productData) =>
      request(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(productData),
      }),
    delete: (id) =>
      request(`/products/${id}`, {
        method: "DELETE",
      }),
    rate: (id, rating, comment, orderId, surveyAnswers) =>
      request(`/products/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating, comment, orderId, surveyAnswers }),
      }),
    respondToReview: (productId, ratingId, response) =>
      request(`/products/${productId}/reviews/${ratingId}/respond`, {
        method: "PUT",
        body: JSON.stringify({ response }),
      }),
  },
  cart: {
    get: () => request("/cart"),
    addItem: (productId, quantity) =>
      request("/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      }),
    updateItem: (productId, quantity) =>
      request(`/cart/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      }),
    removeItem: (productId) =>
      request(`/cart/${productId}`, {
        method: "DELETE",
      }),
    clear: () =>
      request("/cart", {
        method: "DELETE",
      }),
  },
  orders: {
    create: (orderData) =>
      request("/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      }),
    getUserOrders: () => request("/orders/my-orders"),
    getPendingReviews: () => request("/orders/pending-reviews"),
    getById: (id) => request(`/orders/${id}`),
    updateStatus: (id, status) =>
      request(`/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    cancel: (id, payload) =>
      request(`/orders/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    return: (id, payload) =>
      request(`/orders/${id}/return`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  payment: {
    createRazorpayOrder: (amount, orderId) =>
      request("/payment/create-order", {
        method: "POST",
        body: JSON.stringify({ amount, orderId }),
      }),
    verify: (paymentData) =>
      request("/payment/verify", {
        method: "POST",
        body: JSON.stringify(paymentData),
      }),
    cancel: (orderId) =>
      request(`/payment/cancel/${orderId}`, {
        method: "POST",
      }),
  },
  admin: {
    getStats: () => request("/admin/stats"),
    getUsers: () => request("/admin/users"),
    updateUserRole: (id, role) =>
      request(`/admin/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    deleteUser: (id) =>
      request(`/admin/users/${id}`, {
        method: "DELETE",
      }),
    getOrders: () => request("/admin/orders"),
    updateOrderStatus: (id, status) =>
      request(`/admin/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    getInsights: () => request("/admin/insights"),
    getVendors: () => request("/admin/vendors"),
    updateVendorStatus: (id, status) =>
      request(`/admin/vendors/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    updateUserAccount: (id, body) =>
      request(`/admin/users/${id}/account`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    getNotificationCenter: () => request("/admin/notifications"),
    getRefunds: () => request("/admin/refunds"),
    processRefund: (id) =>
      request(`/admin/refunds/${id}/process`, { method: "PUT" }),
    getReviews: () => request("/admin/reviews"),
    deleteReview: (productId, ratingId) =>
      request(`/admin/reviews/${productId}/${ratingId}`, { method: "DELETE" }),
    getLogs: () => request("/admin/logs"),
    getReports: () => request("/admin/reports"),
    getCouponAnalytics: () => request("/admin/coupon-analytics"),
    broadcast: (body) =>
      request("/admin/broadcast", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getAnnouncements: () => request("/admin/announcements"),
  },
  vendor: {
    getStats: (timeframe) => request(`/vendor/stats?timeframe=${timeframe || '7d'}`),
    getProducts: () => request("/vendor/products"),
    getOrders: () => request("/vendor/orders"),
    updateOrderStatus: (id, status) =>
      request(`/vendor/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    refundOrder: (id) =>
      request(`/vendor/orders/${id}/refund`, {
        method: "PUT",
      }),
    approveReturn: (id) =>
      request(`/vendor/orders/${id}/approve-return`, {
        method: "PUT",
      }),
    getDeliveryPartners: (all = false) =>
      request(`/vendor/delivery-partners${all ? "?all=true" : ""}`),
    createDeliveryPartner: (body) =>
      request("/vendor/delivery-partners", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateDeliveryPartner: (id, body) =>
      request(`/vendor/delivery-partners/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    dispatchOrder: (id, body) =>
      request(`/vendor/orders/${id}/dispatch`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    confirmPartnerDelivery: (id) =>
      request(`/vendor/orders/${id}/confirm-delivery`, {
        method: "PUT",
      }),
    uploadImage: (formData) =>
      request("/products/upload", {
        method: "POST",
        body: formData,
        headers: {
          // Fetch will automatically set content-type for FormData
          "Content-Type": undefined,
        },
      }),
  },
  coupons: {
    // Customer
    getActive: () => request("/coupons/active"),
    getActiveCount: () => request("/coupons/active/count"),
    getByCode: (code) => request(`/coupons/code/${code}`),
    // Vendor
    create: (couponData) =>
      request("/coupons", {
        method: "POST",
        body: JSON.stringify(couponData),
      }),
    getVendorCoupons: () => request("/coupons/vendor"),
    update: (id, couponData) =>
      request(`/coupons/${id}`, {
        method: "PUT",
        body: JSON.stringify(couponData),
      }),
    delete: (id) =>
      request(`/coupons/${id}`, { method: "DELETE" }),
    // Admin
    getAll: () => request("/coupons/admin"),
    approve: (id) =>
      request(`/coupons/${id}/approve`, { method: "PUT" }),
    disable: (id) =>
      request(`/coupons/${id}/disable`, { method: "PUT" }),
  },
  about: {
    getStats: () => request("/about/stats"),
    getPrivacyMeta: () => request("/about/privacy"),
    getTermsMeta: () => request("/about/terms"),
  },
  queries: {
    create: (queryData) =>
      request("/queries", {
        method: "POST",
        body: JSON.stringify(queryData),
      }),
    getAll: () => request("/queries"),
    resolve: (id) =>
      request(`/queries/${id}/resolve`, {
        method: "PUT",
      }),
    reply: (id, body) =>
      request(`/queries/${id}/reply`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    delete: (id) =>
      request(`/queries/${id}`, {
        method: "DELETE",
      }),
  },
};
