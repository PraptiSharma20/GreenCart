import { CheckCircle2 } from 'lucide-react';
import { useLang } from '../context/language';

export function OrderRefundBanner({ order }) {
  const { t, lang } = useLang();
  const status = order.status?.toLowerCase();
  const isRefunded = status === 'refunded';
  const isCancelledWithRefund = status === 'cancelled' && order.refundAmount > 0 && order.refundedAt;

  if (!isRefunded && !isCancelledWithRefund) return null;

  const amount = order.refundAmount ?? order.totalPrice ?? 0;
  const refundDate = order.refundedAt
    ? new Date(order.refundedAt).toLocaleDateString(
        lang === 'hi' ? 'hi-IN' : lang === 'pa' ? 'pa-IN' : 'en-US',
        { weekday: 'short', day: 'numeric', month: 'short' }
      )
    : '';

  return (
    <div className="mb-4 rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
      <p className="text-lg font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5" />
        {t('refund_successful')}
      </p>
      {amount > 0 && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          {t('refund_amount_date')
            .replace('{amount}', `₹${Number(amount).toFixed(2)}`)
            .replace('{date}', refundDate)}
        </p>
      )}
      {order.actionDetails?.reasonLabel && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t('refund_reason')}: {order.actionDetails.reasonLabel}
        </p>
      )}
    </div>
  );
}

export function OrderItemRefundLine({ order, item }) {
  const { t, lang } = useLang();
  const status = order.status?.toLowerCase();
  if (status !== 'refunded' && !(status === 'cancelled' && order.refundedAt)) return null;

  const amount = item.price * item.quantity;
  const refundDate = order.refundedAt
    ? new Date(order.refundedAt).toLocaleDateString(
        lang === 'hi' ? 'hi-IN' : lang === 'pa' ? 'pa-IN' : 'en-US',
        { weekday: 'short', day: 'numeric', month: 'short' }
      )
    : '';

  return (
    <div className="mt-2">
      <p className="text-sm font-bold text-green-600 dark:text-green-400">{t('refund_successful')}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('refund_item_amount')
          .replace('{amount}', `₹${amount.toFixed(2)}`)
          .replace('{date}', refundDate)}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        {t('qty_label')}: {item.quantity}
      </p>
    </div>
  );
}
