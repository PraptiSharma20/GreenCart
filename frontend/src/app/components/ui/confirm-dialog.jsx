import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from './card';
import { Button } from './button';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  detail = null,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  icon = null,
  isLoading = false,
  closeOnConfirm = true,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isPurple = variant === 'purple';

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'string' && icon.length > 0) {
      return <span className="text-4xl leading-none">{icon}</span>;
    }
    if (isDanger) {
      return <Trash2 className="h-9 w-9 text-red-600 dark:text-red-400" strokeWidth={2.25} />;
    }
    return <AlertTriangle className="h-9 w-9 text-amber-600 dark:text-amber-400" strokeWidth={2.25} />;
  };

  const handleConfirm = async () => {
    await onConfirm?.();
    if (closeOnConfirm && !isLoading) onClose();
  };

  const dialog = (
    <div
      className="fixed inset-0 z-[20100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={() => !isLoading && onClose()}
    >
      <Card
        className="w-full max-w-md overflow-hidden shadow-2xl rounded-3xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 animate-in zoom-in-95 slide-in-from-bottom-3 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={clsx(
            'h-1.5 w-full',
            isDanger
              ? 'bg-gradient-to-r from-red-500 via-rose-500 to-orange-500'
              : isPurple
                ? 'bg-gradient-to-r from-purple-600 to-violet-600'
                : 'bg-gradient-to-r from-amber-400 to-yellow-500'
          )}
        />

        <div className="relative p-8 pt-7">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div
              className={clsx(
                'relative h-[5.5rem] w-[5.5rem] rounded-2xl flex items-center justify-center mb-6',
                isDanger
                  ? 'bg-red-50 dark:bg-red-950/50 ring-4 ring-red-100/80 dark:ring-red-900/40'
                  : isPurple
                    ? 'bg-purple-50 dark:bg-purple-950/40 ring-4 ring-purple-100/80 dark:ring-purple-900/30'
                    : 'bg-amber-50 dark:bg-amber-950/40 ring-4 ring-amber-100/80 dark:ring-amber-900/30'
              )}
            >
              {isDanger && (
                <span className="absolute inset-0 rounded-2xl bg-red-400/20 animate-ping" aria-hidden />
              )}
              <span className="relative">{renderIcon()}</span>
            </div>

            <h3
              id="confirm-dialog-title"
              className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight px-6"
            >
              {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4 px-2 text-[15px]">
              {message}
            </p>

            {detail && (
              <div className="w-full mb-8 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {detail.label}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                  {detail.value}
                </p>
                {detail.sub && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{detail.sub}</p>
                )}
              </div>
            )}

            {!detail && <div className="mb-6" />}

            <div className="flex w-full gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                className="flex-1 h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                onClick={onClose}
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                disabled={isLoading}
                className={clsx(
                  'flex-1 h-12 rounded-2xl text-white font-bold shadow-lg transition-all gap-2',
                  isDanger
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/25'
                    : isPurple
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-purple-500/25'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'
                )}
                onClick={handleConfirm}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {confirmText}
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return createPortal(dialog, document.body);
}
