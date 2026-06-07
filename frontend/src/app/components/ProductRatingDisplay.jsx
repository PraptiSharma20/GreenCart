import { Star } from 'lucide-react';
import { useLang } from '../context/language';

const STAR_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/** Read-only average rating for product cards and detail pages. */
export function ProductRatingDisplay({
  rating = 0,
  reviewCount = 0,
  size = 'sm',
  showScore = true,
  showCount = true,
  className = '',
}) {
  const { t } = useLang();
  const starClass = STAR_SIZES[size] || STAR_SIZES.sm;
  const rounded = Math.round(rating || 0);

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label={`${rating.toFixed(1)} out of 5, ${reviewCount} reviews`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starClass} ${
              star <= rounded
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
            aria-hidden
          />
        ))}
      </div>
      {showScore && (
        <div className="flex items-center gap-2">
          {rating > 0 ? (
            <span className={`font-bold dark:text-gray-200 ${size === 'sm' ? 'text-sm' : 'text-xl'}`}>
              {rating.toFixed(1)}
            </span>
          ) : (
            <span className={`font-medium text-gray-400 dark:text-gray-500 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
              {t('no_ratings')}
            </span>
          )}
          {showCount && (
            <span className={`text-gray-500 dark:text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              ({reviewCount})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
