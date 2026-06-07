import { useState } from 'react';
import { Star } from 'lucide-react';
import { useLang } from '../context/language';

const STAR_LABEL_KEYS = {
  1: 'rating_label_1',
  2: 'rating_label_2',
  3: 'rating_label_3',
  4: 'rating_label_4',
  5: 'rating_label_5',
};

/** Meesho-style 5-star row with label under each star. */
export function MeeshoStarRatingRow({ onSelect, titleKey = 'review_rate_experience', className = '' }) {
  const { t } = useLang();
  const [hover, setHover] = useState(0);

  return (
    <div
      className={`rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 px-4 py-4 ${className}`}
    >
      <p className="font-bold text-gray-900 dark:text-white mb-4 text-base">
        {t(titleKey)}
      </p>
      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onSelect?.(star)}
            className="flex flex-col items-center flex-1 gap-1.5 p-1 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors min-w-0"
            aria-label={`${star} — ${t(STAR_LABEL_KEYS[star])}`}
          >
            <Star
              className={`h-8 w-8 sm:h-9 sm:w-9 shrink-0 transition-colors ${
                star <= hover
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-400 dark:text-gray-500 stroke-[1.5]'
              }`}
            />
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 text-center leading-tight w-full truncate">
              {t(STAR_LABEL_KEYS[star])}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
