/**
 * Distinguish who cancelled an order (customer vs vendor vs payment/system).
 */
export function getOrderCancellationSource(order) {
  if (order?.status?.toLowerCase() !== 'cancelled') return null;

  const by = order.cancelledBy?.toLowerCase();
  if (by === 'customer') return 'customer';
  if (by === 'vendor') return 'vendor';
  if (by === 'system') return 'system';

  if (order.actionDetails?.actionType === 'cancel') return 'customer';

  return 'vendor';
}

/** Labels and styles for client (customer) orders page */
export function getClientCancellationDisplay(source, t) {
  if (!source) return null;

  if (source === 'customer') {
    return {
      source,
      label: t('order_cancelled_by_you'),
      hint: t('order_cancelled_by_you_hint'),
      badgeClass:
        'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-600',
      dotClass: 'bg-slate-500',
    };
  }

  if (source === 'vendor') {
    return {
      source,
      label: t('order_cancelled_by_vendor'),
      hint: t('order_cancelled_by_vendor_hint'),
      badgeClass:
        'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800',
      dotClass: 'bg-rose-500',
    };
  }

  return {
    source,
    label: t('order_cancelled_generic'),
    hint: null,
    badgeClass:
      'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
    dotClass: 'bg-gray-500',
  };
}

/** Labels and styles for vendor orders dashboard */
export function getVendorCancellationDisplay(source, t) {
  if (!source) return null;

  if (source === 'customer') {
    return {
      source,
      label: t('vendor_order_cancelled_by_customer'),
      hint: t('vendor_order_cancelled_by_customer_hint'),
      badgeClass:
        'bg-slate-900/30 text-white border border-white/30 backdrop-blur-sm',
      sidebarClass: 'bg-slate-600',
      reasonBoxClass:
        'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-600',
      reasonTitleClass: 'text-slate-800 dark:text-slate-200',
      reasonTitleKey: 'vendor_customer_cancel_reason',
    };
  }

  return {
    source,
    label: t('vendor_order_cancelled_by_you'),
    hint: t('vendor_order_cancelled_by_you_hint'),
    badgeClass:
      'bg-rose-950/40 text-white border border-rose-200/40 backdrop-blur-sm',
    sidebarClass: 'bg-rose-600',
    reasonBoxClass: null,
    reasonTitleClass: null,
    reasonTitleKey: null,
  };
}

export function getOrderStatusBadgeForClient(order, status, t, getStatusBadgeClass) {
  const cancelSource = getOrderCancellationSource(order);
  if (cancelSource) {
    const display = getClientCancellationDisplay(cancelSource, t);
    return {
      label: display.label,
      badgeClass: display.badgeClass,
      hint: display.hint,
      cancelSource,
    };
  }
  return {
    label: t(status) || status,
    badgeClass: getStatusBadgeClass(status),
    hint: null,
    cancelSource: null,
  };
}
