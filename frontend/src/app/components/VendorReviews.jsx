import { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Star, MessageSquare, Loader2, Heart, Search, X, ChevronDown } from 'lucide-react';
import { useLang } from '../context/language';

const THANK_PRESETS = [
  'thank_preset_1',
  'thank_preset_2',
  'thank_preset_3',
];

const RECENT_REVIEWS_LIMIT = 5;

export function VendorReviews() {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thankingReviewId, setThankingReviewId] = useState(null);
  const [thankMessage, setThankMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    fetchVendorProducts();
  }, []);

  const fetchVendorProducts = async () => {
    try {
      const data = await api.vendor.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error(t('err_load_products'));
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (review) => {
    if (typeof review.user === 'object' && review.user?.name) {
      return review.user.name;
    }
    return t('anonymous_customer');
  };

  const handleThank = async (productId, ratingId, message, customerName) => {
    const text = message?.trim();
    if (!text) {
      toast.error(t('err_write_thank'));
      return;
    }
    try {
      const updatedProduct = await api.products.respondToReview(productId, ratingId, text);
      setProducts(products.map(p => (p._id || p.id) === (updatedProduct._id || updatedProduct.id) ? updatedProduct : p));
      toast.success(
        t('vendor_thank_sent_to').replace('{name}', customerName)
      );
      setThankingReviewId(null);
      setThankMessage('');
    } catch (error) {
      toast.error(error.message || t('err_thank_fail'));
    }
  };

  const allReviews = useMemo(
    () =>
      products
        .flatMap((product) =>
          (product.ratings || [])
            .filter((rating) => {
              const role = rating.user?.role;
              return !role || role === 'customer';
            })
            .map((rating) => ({
              ...rating,
              productId: product._id || product.id,
              productName: product.name,
              productImage: product.image,
            }))
        )
        .sort((a, b) => new Date(b.ratedAt) - new Date(a.ratedAt)),
    [products]
  );

  const trimmedSearch = searchQuery.trim();
  const isSearching = trimmedSearch.length > 0;

  const filteredReviews = useMemo(() => {
    if (!isSearching) return allReviews;
    const q = trimmedSearch.toLowerCase();
    return allReviews.filter((review) => {
      const productName = (review.productName || '').toLowerCase();
      const customerName = getCustomerName(review).toLowerCase();
      const comment = (review.comment || '').toLowerCase();
      return productName.includes(q) || customerName.includes(q) || comment.includes(q);
    });
  }, [allReviews, isSearching, trimmedSearch, t]);

  const displayedReviews = useMemo(() => {
    if (isSearching) return filteredReviews;
    if (showAllReviews) return allReviews;
    return allReviews.slice(0, RECENT_REVIEWS_LIMIT);
  }, [allReviews, filteredReviews, isSearching, showAllReviews]);

  const canViewAll =
    !isSearching && !showAllReviews && allReviews.length > RECENT_REVIEWS_LIMIT;
  const showRecentLabel =
    !isSearching && !showAllReviews && allReviews.length > 0;

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (value.trim()) {
      setShowAllReviews(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-green-600" />
            {t('reviews_ratings_title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('vendor_reviews_subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto lg:min-w-[280px] lg:max-w-md shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('search_reviews_vendor')}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all dark:text-white dark:placeholder-gray-500"
              aria-label={t('search_reviews_vendor')}
            />
            {isSearching && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('cancel')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap text-center sm:text-right">
            {allReviews.length} {t('total_reviews_label')}
          </span>
        </div>
      </div>

      {isSearching && filteredReviews.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('reviews_search_results')
            .replace('{count}', String(filteredReviews.length))
            .replace('{query}', trimmedSearch)}
        </p>
      )}

      {showRecentLabel && (
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {t('recent_reviews_section')}
        </h3>
      )}

      {allReviews.length === 0 ? (
        <Card className="p-12 text-center border-none">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('no_reviews')}</h3>
          <p className="text-gray-500 dark:text-gray-400">{t('no_reviews_desc')}</p>
        </Card>
      ) : displayedReviews.length === 0 ? (
        <Card className="p-12 text-center border-none">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('reviews_search_no_match')}
          </h3>
          <Button variant="outline" className="mt-4" onClick={clearSearch}>
            {t('cancel')}
          </Button>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {displayedReviews.map((review) => {
              const customerName = getCustomerName(review);
              return (
                <Card key={review._id} className="p-6 border-none">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-48 flex-shrink-0">
                      <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 h-32">
                        <img
                          src={
                            review.productImage?.startsWith('http')
                              ? review.productImage
                              : `http://localhost:5000${review.productImage}`
                          }
                          alt={review.productName}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/192x128?text=Product';
                          }}
                        />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {review.productName}
                      </p>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-1">
                            {t('review_from_customer')}
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white text-lg">
                            {customerName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('review_on_product').replace('{product}', review.productName)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.ratedAt && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(review.ratedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {review.vendorResponse || review.vendorThanked ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {t('vendor_thanked_customer').replace('{name}', customerName)}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {t('pending_thank')}
                          </Badge>
                        )}
                      </div>

                      {review.surveyAnswers?.length > 0 && (
                        <div className="mb-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4 space-y-2 text-sm">
                          {review.surveyAnswers.map((row, i) => (
                            <p key={i} className="text-gray-700 dark:text-gray-300">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {row.question}:{' '}
                              </span>
                              {row.answer}
                            </p>
                          ))}
                        </div>
                      )}

                      {review.comment && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed italic border-l-4 border-yellow-400 pl-4">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      )}

                      {review.vendorResponse && (
                        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 p-4 rounded-r-lg mb-4">
                          <p className="text-sm font-semibold text-green-800 dark:text-green-400 flex items-center gap-2 mb-2">
                            <Heart className="h-4 w-4 fill-green-600" />
                            {t('your_thank_to_customer').replace('{name}', customerName)}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">{review.vendorResponse}</p>
                          {review.vendorResponseDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(review.vendorResponseDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {!review.vendorResponse && (
                        <>
                          {thankingReviewId === review._id ? (
                            <div className="space-y-4">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('thank_customer_prompt')}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {THANK_PRESETS.map((key) => (
                                  <Button
                                    key={key}
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full text-xs border-green-200 text-green-800 hover:bg-green-50 dark:border-green-800 dark:text-green-300"
                                    onClick={() =>
                                      handleThank(review.productId, review._id, t(key), customerName)
                                    }
                                  >
                                    {t(key)}
                                  </Button>
                                ))}
                              </div>
                              <Textarea
                                placeholder={t('write_thank_message')}
                                value={thankMessage}
                                onChange={(e) => setThankMessage(e.target.value)}
                                className="bg-white dark:bg-gray-800"
                              />
                              <div className="flex gap-3">
                                <Button
                                  onClick={() =>
                                    handleThank(
                                      review.productId,
                                      review._id,
                                      thankMessage,
                                      customerName
                                    )
                                  }
                                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                >
                                  <Heart className="h-4 w-4" />
                                  {t('send_thank')}
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setThankingReviewId(null);
                                    setThankMessage('');
                                  }}
                                >
                                  {t('cancel')}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                              onClick={() => setThankingReviewId(review._id)}
                            >
                              <Heart className="h-4 w-4" />
                              {t('thank_customer')}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {canViewAll && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="gap-2 rounded-xl border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20 px-8"
                onClick={() => setShowAllReviews(true)}
              >
                <ChevronDown className="h-4 w-4" />
                {t('view_all_reviews')} ({allReviews.length})
              </Button>
            </div>
          )}

          {!isSearching && showAllReviews && allReviews.length > RECENT_REVIEWS_LIMIT && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                className="text-gray-600 dark:text-gray-400"
                onClick={() => setShowAllReviews(false)}
              >
                {t('show_less_reviews')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
