import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, Clock, AlertCircle, Star } from 'lucide-react';
import { Button } from './ui/button';
import { useLang } from '../context/language';
import { MeeshoStarRatingRow } from './MeeshoStarRatingRow';
import {
  getUserRatingOnOrder,
  getProductId,
  getAuthUserId,
} from '../utils/reviewUtils';
import { getReturnWindowInfo, getDeliveredAt } from '../utils/orderActionUtils';

export function OrderDeliveredPanel({
  order,
  user,
  onReturnClick,
  onStarClick,
}) {
  const { t, lang } = useLang();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (order?.status?.toLowerCase() !== 'delivered') return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [order?._id, order?.status]);

  const returnInfo = getReturnWindowInfo(order);
  const deliveredAt = getDeliveredAt(order);
  const orderId = order._id || order.id;
  const userId = getAuthUserId(user);
  const items = order.items || [];

  const deliveredLabel = deliveredAt
    ? deliveredAt.toLocaleDateString(
        lang === 'hi' ? 'hi-IN' : lang === 'pa' ? 'pa-IN' : 'en-US',
        { weekday: 'short', day: 'numeric', month: 'short' }
      )
    : '';

  const itemsNeedingRating = items.filter(
    (item) => !getUserRatingOnOrder(item.product, userId, orderId)
  );

  const submittedRating = items
    .map((item) => getUserRatingOnOrder(item.product, userId, orderId))
    .find(Boolean);

  const showRatingStars = userId && itemsNeedingRating.length > 0;

  return (
    <div className="mb-6 rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-green-50 dark:bg-green-900/25 border-b border-green-100 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-green-800 dark:text-green-300">
              {t('order_delivered_title')}
            </p>
            {deliveredLabel && (
              <p className="text-xs text-green-700/80 dark:text-green-400/90">
                {t('order_delivered_on').replace('{date}', deliveredLabel)}
              </p>
            )}
          </div>
        </div>

        {showRatingStars && (
          <div className="mt-4 space-y-3">
            {itemsNeedingRating.map((item, idx) => {
              const name = item.product?.name || item.name || 'Product';
              const productId = getProductId(item.product);
              return (
                <div key={productId || idx}>
                  {itemsNeedingRating.length > 1 && (
                    <p className="text-xs font-semibold text-green-800/80 dark:text-green-300/80 mb-2 truncate">
                      {name}
                    </p>
                  )}
                  <MeeshoStarRatingRow
                    onSelect={(star) =>
                      onStarClick?.({
                        order,
                        item,
                        productId,
                        productName: name,
                        productImage: item.product?.image || item.image,
                        rating: star,
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {!showRatingStars && submittedRating && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">{t('review_already_submitted')}</span>
            <div className="flex items-center gap-0.5 ml-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= (submittedRating.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        {returnInfo.open ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {t('return_window_open')}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {returnInfo.hoursLeft > 0
                    ? t('return_time_left_hm')
                        .replace('{hours}', String(returnInfo.hoursLeft))
                        .replace('{minutes}', String(returnInfo.minutesLeft))
                    : t('return_time_left_m').replace(
                        '{minutes}',
                        String(returnInfo.minutesLeft)
                      )}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 shrink-0"
              onClick={onReturnClick}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {t('order_return_btn')}
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{t('return_window_closed')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
