import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createContext, useContext } from 'react';
import { api } from '../../lib/api';
import { useAuth } from './auth';
import { OrderReviewModal } from '../components/OrderReviewModal';
import { OrderReviewFormModal } from '../components/OrderReviewFormModal';
import { toast } from 'sonner';
import { useLang } from './language';

const ReviewPromptContext = createContext(null);

const DISMISS_PREFIX = 'gc_review_dismiss_';
const DISMISS_HOURS = 24;

function dismissKey(orderId, productId) {
  return `${DISMISS_PREFIX}${String(orderId)}_${String(productId)}`;
}

function isDismissed(orderId, productId) {
  const raw = localStorage.getItem(dismissKey(orderId, productId));
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && Date.now() < until;
}

function setDismissed(orderId, productId) {
  const until = Date.now() + DISMISS_HOURS * 60 * 60 * 1000;
  localStorage.setItem(dismissKey(orderId, productId), String(until));
}

export function ReviewPromptProvider({ children }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [allPending, setAllPending] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissTick, setDismissTick] = useState(0);
  const [formDraft, setFormDraft] = useState(null);
  const skipNextAutoOpenRef = useRef(false);
  const activeItemRef = useRef(null);

  const popupQueue = useMemo(
    () =>
      allPending.filter(
        (item) => !isDismissed(item.orderId, item.productId)
      ),
    [allPending, dismissTick]
  );

  const isCustomer =
    user && user.role !== 'vendor' && user.role !== 'admin';

  const refreshPending = useCallback(async () => {
    if (!isCustomer) {
      setAllPending([]);
      return;
    }
    try {
      const items = await api.orders.getPendingReviews();
      setAllPending(items);
    } catch (err) {
      console.error('Failed to load pending reviews:', err);
    }
  }, [isCustomer]);

  useEffect(() => {
    activeItemRef.current = activeItem;
  }, [activeItem]);

  useEffect(() => {
    refreshPending();
    if (!isCustomer) return undefined;
    const id = setInterval(refreshPending, 20000);
    return () => clearInterval(id);
  }, [isCustomer, refreshPending, user]);

  useEffect(() => {
    if (!isCustomer || manualOpen || activeItem || formDraft) return;
    if (skipNextAutoOpenRef.current) {
      skipNextAutoOpenRef.current = false;
      return;
    }
    const next = popupQueue[0];
    if (next) {
      setActiveItem(next);
    }
  }, [popupQueue, activeItem, isCustomer, manualOpen, formDraft]);

  const openReviewFor = useCallback(
    (item) => {
      setManualOpen(true);
      setActiveItem(item);
    },
    []
  );

  const closeModal = useCallback(() => {
    skipNextAutoOpenRef.current = true;
    setActiveItem(null);
    setManualOpen(false);
  }, []);

  const handleSubmit = async ({ rating, comment, orderId, productId, surveyAnswers }) => {
    try {
      await api.products.rate(productId, rating, comment, orderId, surveyAnswers);
      toast.success(t('review_submit_success'));

      // Remove immediately so the auto-popup effect cannot reopen this item
      // while refreshPending is still in flight.
      setAllPending((prev) =>
        prev.filter(
          (p) =>
            !(
              String(p.orderId) === String(orderId) &&
              String(p.productId) === String(productId)
            )
        )
      );

      await refreshPending();

      setActiveItem(null);
      setManualOpen(false);
      setFormDraft(null);
    } catch (error) {
      toast.error(error.message || t('review_submit_error'));
      throw error;
    }
  };

  const handleRemindLater = useCallback((item) => {
    if (!item) return;
    setDismissed(String(item.orderId), String(item.productId));
    skipNextAutoOpenRef.current = true;
    setDismissTick((n) => n + 1);
    setActiveItem(null);
    setManualOpen(false);
    toast.message(t('review_remind_toast'));
  }, [t]);

  const value = useMemo(
    () => ({ refreshPending, openReviewFor, allPending }),
    [refreshPending, openReviewFor, allPending]
  );

  const handlePopupStarClick = useCallback((rating) => {
    const current = activeItemRef.current;
    if (!current) return;
    setFormDraft({ ...current, rating });
    setActiveItem(null);
  }, []);

  const closeFormModal = useCallback(() => {
    skipNextAutoOpenRef.current = true;
    setFormDraft(null);
  }, []);

  return (
    <ReviewPromptContext.Provider value={value}>
      {children}
      {isCustomer && (
        <>
          <OrderReviewModal
            isOpen={!!activeItem}
            item={activeItem}
            queueLength={popupQueue.length}
            onClose={closeModal}
            onStarClick={handlePopupStarClick}
            onRemindLater={handleRemindLater}
          />
          <OrderReviewFormModal
            key={formDraft ? `${formDraft.productId}-${formDraft.orderId}-${formDraft.rating}` : 'closed'}
            isOpen={!!formDraft}
            orderId={formDraft?.orderId}
            orderShortId={formDraft?.orderShortId}
            productId={formDraft?.productId}
            productName={formDraft?.productName}
            productImage={formDraft?.productImage}
            initialRating={formDraft?.rating || 0}
            onClose={closeFormModal}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </ReviewPromptContext.Provider>
  );
}

export function useReviewPrompt() {
  const ctx = useContext(ReviewPromptContext);
  if (!ctx) {
    throw new Error('useReviewPrompt must be used within ReviewPromptProvider');
  }
  return ctx;
}
