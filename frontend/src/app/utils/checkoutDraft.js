export const CHECKOUT_KEYS = {
  form: 'gc_checkout_form',
  delivery: 'gc_checkout_delivery',
  payment: 'gc_checkout_payment',
  coupon: 'gc_checkout_coupon',
  discount: 'gc_checkout_discount',
};

const FRESH_CHECKOUT_FLAG = 'gc_checkout_fresh';

/** Call once when user starts checkout from the cart (consumed on first checkout mount). */
export function beginCheckoutSession() {
  sessionStorage.setItem(FRESH_CHECKOUT_FLAG, '1');
}

export function consumeFreshCheckoutSession() {
  if (sessionStorage.getItem(FRESH_CHECKOUT_FLAG) !== '1') return false;
  sessionStorage.removeItem(FRESH_CHECKOUT_FLAG);
  return true;
}

export function getDefaultCheckoutForm(user) {
  return {
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  };
}

export function clearCheckoutDraft() {
  Object.values(CHECKOUT_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

export function loadCheckoutDraft() {
  const formRaw = sessionStorage.getItem(CHECKOUT_KEYS.form);
  return {
    form: formRaw ? JSON.parse(formRaw) : null,
    delivery: sessionStorage.getItem(CHECKOUT_KEYS.delivery),
    payment: sessionStorage.getItem(CHECKOUT_KEYS.payment),
    coupon: sessionStorage.getItem(CHECKOUT_KEYS.coupon) || '',
    discount: Number(sessionStorage.getItem(CHECKOUT_KEYS.discount)) || 0,
  };
}

export function saveCheckoutDraft({ form, delivery, payment, coupon = '', discount = 0 }) {
  if (form) sessionStorage.setItem(CHECKOUT_KEYS.form, JSON.stringify(form));
  if (delivery) sessionStorage.setItem(CHECKOUT_KEYS.delivery, delivery);
  else sessionStorage.removeItem(CHECKOUT_KEYS.delivery);
  if (payment) sessionStorage.setItem(CHECKOUT_KEYS.payment, payment);
  else sessionStorage.removeItem(CHECKOUT_KEYS.payment);
  sessionStorage.setItem(CHECKOUT_KEYS.coupon, coupon);
  sessionStorage.setItem(CHECKOUT_KEYS.discount, String(discount));
}
