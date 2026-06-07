import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, Package } from 'lucide-react';
import { useLang } from '../context/language';
import { MeeshoStarRatingRow } from './MeeshoStarRatingRow';
import { ReviewModalPortal } from './ReviewModalPortal';

function productImageUrl(image) {
  if (!image) return 'https://placehold.co/120x120?text=Product';
  return image.startsWith('http') ? image : `http://localhost:5000${image}`;
}

export function OrderReviewModal({
  isOpen,
  item,
  queueLength = 1,
  onClose,
  onStarClick,
  onRemindLater,
}) {
  const { t } = useLang();

  if (!isOpen || !item) return null;

  return (
    <ReviewModalPortal open={isOpen} onBackdropClose={onClose}>
      <Card
        className="w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-700 rounded-3xl relative z-[20101]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            aria-label={t('close')}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-green-100 text-sm font-medium mb-1 pr-10">
            <Package className="h-4 w-4 shrink-0" />
            {t('review_order_delivered')} #{item.orderShortId}
          </div>
          <h2 className="text-2xl font-bold pr-8">{t('review_modal_title')}</h2>
          {queueLength > 1 && (
            <p className="text-green-100 text-sm mt-1">
              {t('review_queue_hint').replace('{count}', String(queueLength))}
            </p>
          )}
        </div>

        <div className="p-6 space-y-5 bg-white dark:bg-gray-800">
          <div className="flex gap-4 items-center">
            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              <img
                src={productImageUrl(item.productImage)}
                alt={item.productName}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{item.productName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('review_modal_subtitle')}</p>
            </div>
          </div>

          <MeeshoStarRatingRow onSelect={onStarClick} />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onRemindLater?.(item)}
              className="w-full rounded-2xl py-6 border-2"
            >
              {t('review_remind_later')}
            </Button>
          </div>
        </div>
      </Card>
    </ReviewModalPortal>
  );
}
