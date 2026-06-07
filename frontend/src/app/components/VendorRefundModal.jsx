import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  AlertTriangle,
  RefreshCcw,
  X,
  Loader2,
  IndianRupee,
} from 'lucide-react';
import { getPaymentLabelKey } from '../utils/vendorRefundUtils';

function ModalShell({ open, onClose, disabled, children }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || disabled) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, disabled, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[20100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!disabled) onClose();
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export function VendorRefundBlockedModal({ blocked, onClose, t }) {
  if (!blocked) return null;
  const { order, reasonKey } = blocked;
  const orderId = (order._id || order.id)?.toString()?.slice(-6).toUpperCase();

  return (
    <ModalShell open onClose={onClose} disabled={false}>
      <Card
        className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-700 relative z-[201]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-amber-500 to-orange-600 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4 pr-10">
            <div className="p-3 rounded-2xl bg-white/20">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black">{t('refund_blocked_title')}</h3>
              <p className="text-amber-100 text-sm font-medium mt-1">
                #{orderId}
                {' · '}
                {t(getPaymentLabelKey(order.paymentMethod))}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
            {t(reasonKey)}
          </p>
          <Button
            type="button"
            className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black"
            onClick={onClose}
          >
            {t('btn_got_it')}
          </Button>
        </div>
      </Card>
    </ModalShell>
  );
}

export function VendorRefundConfirmModal({
  order,
  onClose,
  onConfirm,
  updating,
  t,
  getOrderTotal,
}) {
  if (!order) return null;
  const isUpdating = updating === order._id;
  const orderId = (order._id || order.id)?.toString()?.slice(-6).toUpperCase();
  const amount = order.totalPrice ?? getOrderTotal(order);

  return (
    <ModalShell open onClose={onClose} disabled={isUpdating}>
      <Card
        className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-700 relative z-[201]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-violet-600 text-white relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4 pr-10">
            <div className="p-3 rounded-2xl bg-white/20">
              <RefreshCcw size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black">{t('refund_confirm_title')}</h3>
              <p className="text-purple-100 text-sm font-medium mt-1">
                {t('refund_confirm_subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('refund_modal_order')}
              </span>
              <span className="font-mono font-black text-lg text-gray-900 dark:text-white">
                #{orderId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('refund_modal_customer')}
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {order.user?.name || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('vendor_payment_mode')}
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {t(getPaymentLabelKey(order.paymentMethod))}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-purple-100 dark:border-purple-800">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('refund_modal_amount')}
              </span>
              <span className="text-2xl font-black text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <IndianRupee size={22} className="opacity-80" />
                {amount.toLocaleString()}
              </span>
            </div>
            {order.actionDetails?.reasonLabel && (
              <div className="pt-2 border-t border-purple-100 dark:border-purple-800">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                  {t('refund_modal_reason')}
                </p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {order.actionDetails.reasonLabel}
                </p>
                {order.actionDetails.additionalComments && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                    &ldquo;{order.actionDetails.additionalComments}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 font-medium leading-relaxed">
            {t('refund_confirm_warning')}
          </p>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-600 dark:text-gray-300 font-bold"
              onClick={onClose}
              disabled={isUpdating}
            >
              {t('btn_cancel')}
            </Button>
            <Button
              type="button"
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-black shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-70"
              onClick={onConfirm}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Processing…
                </span>
              ) : (
                t('refund_confirm_btn')
              )}
            </Button>
          </div>
        </div>
      </Card>
    </ModalShell>
  );
}
