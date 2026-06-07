import { useState } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { useLang } from '../context/language';
import { getUserRatingOnProduct } from '../utils/reviewUtils';

const RATING_LABELS = {
  1: 'rating_label_1',
  2: 'rating_label_2',
  3: 'rating_label_3',
  4: 'rating_label_4',
  5: 'rating_label_5',
};

const MEESHO_LABELS = {
  1: 'rating_label_1',
  2: 'rating_label_2',
  3: 'rating_label_3',
  4: 'rating_label_4',
  5: 'rating_label_5',
};

export function OrderItemReview({
  orderId,
  orderShortId,
  product,
  productName,
  userId,
  onRated,
  variant = 'default',
  showProductTitle = false,
}) {
  const { t } = useLang();
  const productId = product?._id || product;
  const existing = getUserRatingOnProduct(product, userId);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (existing || submitted) {
    const stars = existing?.rating || rating;
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">{t('review_already_submitted')}</span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const displayRating = hoverRating || rating;
  const labelKey = displayRating ? RATING_LABELS[displayRating] : null;

  const handleSubmit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    try {
      await api.products.rate(productId, rating, comment, orderId);
      toast.success(t('review_submit_success'));
      setSubmitted(true);
      onRated?.();
    } catch (error) {
      toast.error(error.message || t('review_submit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'meesho') {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3">
        {showProductTitle && (
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 truncate">
            {productName}
          </p>
        )}
        <div className="flex justify-between gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="flex flex-col items-center flex-1 gap-1 p-1 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
              aria-label={`${star} stars`}
            >
              <Star
                className={`h-8 w-8 ${
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-500'
                }`}
              />
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 text-center leading-tight">
                {t(MEESHO_LABELS[star])}
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <>
            <Textarea
              placeholder={t('review_comment_placeholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="mb-2 text-sm bg-gray-50 dark:bg-gray-900"
            />
            <Button
              size="sm"
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                t('review_submit')
              )}
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-600">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
        {t('review_rate_this_item')}
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="p-0.5 rounded hover:scale-110 transition-transform"
            aria-label={`${star} stars`}
          >
            <Star
              className={`h-7 w-7 ${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-500'
              }`}
            />
          </button>
        ))}
        {labelKey && (
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400 ml-1">
            {t(labelKey)}
          </span>
        )}
      </div>
      <Textarea
        placeholder={t('review_comment_placeholder')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="mb-2 text-sm bg-white dark:bg-gray-800"
      />
      <Button
        size="sm"
        disabled={!rating || submitting}
        onClick={handleSubmit}
        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl gap-1"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Star className="h-4 w-4 fill-white" />
            {t('review_submit')}
          </>
        )}
      </Button>
      <p className="text-xs text-gray-400 mt-2">
        {t('review_order_ref').replace('{id}', orderShortId)} · {productName}
      </p>
    </div>
  );
}
