import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function ReviewModalPortal({ open, onBackdropClose, children }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !onBackdropClose) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onBackdropClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onBackdropClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[20100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
      role="presentation"
      onClick={() => onBackdropClose?.()}
    >
      {children}
    </div>,
    document.body
  );
}
