import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Star, Minus, Plus, Loader2, Edit2, Heart, MessageSquare, CheckCircle2 } from 'lucide-react';
import { ProductRatingDisplay } from '../components/ProductRatingDisplay';
import { getUserRatingOnProduct, getAuthUserId } from '../utils/reviewUtils';
import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/cart';
import { useLang } from '../context/language';
import { useAuth } from '../context/auth';
import { localizeProduct } from '../i18n/productTranslations';
import { toast } from 'sonner';
import { api } from '../../lib/api';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, toggleWishlist, isAuthenticated } = useAuth();
  const { t, lang } = useLang();
  const { addToCart, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState([]);

  const userRatingEntry = useMemo(
    () => getUserRatingOnProduct(product, getAuthUserId(user)),
    [user, product]
  );
  const userRating = userRatingEntry?.rating || 0;

  // Check if user is vendor of this product
  const isVendor = useMemo(() => {
    if (!user || !product) return false;
    const vendorId = typeof product.vendor?._id || product.vendor;
    return String(vendorId) === getAuthUserId(user);
  }, [user, product]);

  const inCart = useMemo(() => {
    if (!product) return 0;
    const productId = product._id || product.id;
    return items.find(i => (i.product?._id || i.product?.id || i._id || i.id) === productId)?.quantity || 0;
  }, [product, items]);

  const isWishlisted = useMemo(() => {
    if (!user || !product) return false;
    const productId = product._id || product.id;
    return user.wishlist?.includes(productId);
  }, [user, product]);

  const displayProduct = useMemo(
    () => (product ? localizeProduct(product, lang) : null),
    [product, lang]
  );

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || id === 'undefined') {
        setLoading(false);
        return;
      }
      try {
        const data = await api.products.getById(id);
        setProduct(data);
        
        // Fetch similar products
        const allProducts = await api.products.getAll();
        setSimilarProducts(
          allProducts
            .filter((p) => p.category === data.category && (p._id || p.id) !== (data._id || data.id))
            .slice(0, 4)
        );
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, lang]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl">Product not found</h1>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${quantity} x ${displayProduct?.name || product.name} added to cart`, { duration: 2000 });
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      await toggleWishlist(product._id || product.id);
      toast.success(!isWishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (error) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-gray-600 dark:text-gray-300">
        ← Back
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="rounded-lg overflow-hidden bg-gray-100 h-[400px] relative">
          <img
            src={product.image?.startsWith('http') ? product.image : `http://localhost:5000${product.image}`}
            alt={displayProduct?.name || product.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.src = 'https://placehold.co/600x400?text=Product+Image';
            }}
          />
          <button
            onClick={handleToggleWishlist}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-lg"
          >
            <Heart
              className={`h-6 w-6 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
            />
          </button>
        </div>

        {/* Product Details */}
        <div>
          <div className="mb-4">
            {product.inStock ? (
              <Badge className="bg-green-600">In Stock</Badge>
            ) : (
              <Badge className="bg-red-600">Out of Stock</Badge>
            )}
          </div>

          <h1 className="mb-2 text-4xl dark:text-white">{displayProduct?.name || product.name}</h1>

          <div className="mb-6">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <ProductRatingDisplay
                rating={product.rating || 0}
                reviewCount={product.reviews || 0}
                size="md"
              />
              {userRating > 0 && !isVendor && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-bold">
                  {t('review_you_rated').replace('{stars}', String(userRating))}
                </span>
              )}
            </div>

            {isVendor && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('vendor_product_review_note')}
                </p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-green-600 dark:text-green-500">
                ₹{product.price.toFixed(2)}
              </span>
              <span className="text-lg text-gray-500 dark:text-gray-400">{product.unit}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('vendor')}</p>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                {typeof product.vendor === 'object' ? product.vendor.name : (product.vendor || 'Official Vendor')}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('category')}</p>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                {displayProduct?.category || product.category}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">{t('description')}</p>
              <p className="mt-1 text-gray-600 leading-relaxed dark:text-gray-300">{product.description}</p>
            </div>

            {user?.role !== 'vendor' ? (
              <>
                <div className="pt-4 border-t dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 dark:text-gray-400">{t('quantity')}</p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 p-1 rounded-lg border dark:border-gray-600">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-10 w-10 hover:bg-white hover:shadow-sm dark:hover:bg-gray-600"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold text-lg dark:text-white">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-10 w-10 hover:bg-white hover:shadow-sm dark:hover:bg-gray-600"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-gray-500 font-medium dark:text-gray-400">
                      {t('total')}: <span className="text-green-600 font-bold dark:text-green-500">₹{(product.price * quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Add to Cart and Wishlist Buttons */}
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1 gap-2 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                  >
                    <Plus className="h-5 w-5" />
                    {t('add_to_cart')}{inCart ? ` (${inCart})` : ''}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 py-6 shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 dark:border-gray-700 dark:text-white"
                    onClick={handleToggleWishlist}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-6 border-t dark:border-gray-700">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 py-6 text-lg border-2 border-green-600 text-green-600 hover:bg-green-50 transition-all dark:border-green-500 dark:text-green-500 dark:hover:bg-green-900/20"
                  onClick={() => navigate(`/vendor/dashboard?tab=products&edit=${product._id || product.id}`)}
                >
                  <Edit2 className="h-5 w-5" />
                  {t('edit_product')}
                </Button>
                <p className="mt-4 text-sm text-center text-gray-500 italic dark:text-gray-400">
                  Vendors can manage their products through the dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-16 border-t pt-16 dark:border-gray-700">
        <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{t('similar_products')}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {similarProducts.map((rawRelated) => {
            const relatedProduct = localizeProduct(rawRelated, lang);
            return (
            <div
              key={rawRelated.id || rawRelated._id}
              className="cursor-pointer rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/product/${relatedProduct.id || relatedProduct._id}`)}
            >
              <div className="mb-4 h-40 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                <img
                  src={relatedProduct.image?.startsWith('http') ? relatedProduct.image : `http://localhost:5000${relatedProduct.image}`}
                  alt={relatedProduct.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/600x400?text=Product+Image';
                  }}
                />
              </div>
              <h3 className="mb-2 font-semibold dark:text-white">{relatedProduct.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${star <= Math.round(relatedProduct.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  />
                ))}
                {relatedProduct.rating > 0 ? (
                  <span className="text-xs text-gray-500 ml-1">{relatedProduct.rating.toFixed(1)} ({relatedProduct.reviews})</span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">No ratings ({relatedProduct.reviews})</span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-green-600 dark:text-green-500">
                  ₹{relatedProduct.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{relatedProduct.unit}</span>
              </div>
            </div>
          );})}
        </div>
      </div>

      {/* Customer reviews */}
      {!isVendor && (
        <div className="mt-16 border-t pt-16 dark:border-gray-700">
          <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-green-600" />
            {t('customer_reviews_title')}
          </h2>
          {(product.ratings?.length ?? 0) === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('customer_reviews_empty')}</p>
          ) : (
          <div className="space-y-6">
            {product.ratings.map((rating, idx) => (
              <div key={rating._id || idx} className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-green-700 dark:text-green-400 font-bold text-lg">
                        {(typeof rating.user === 'object' ? rating.user?.name : 'User')?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {typeof rating.user === 'object' ? rating.user?.name : 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= rating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {rating.ratedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(rating.ratedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {rating.surveyAnswers?.length > 0 && (
                  <div className="mb-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {rating.surveyAnswers.map((row, i) => (
                      <p key={i}>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{row.question}: </span>
                        {row.answer}
                      </p>
                    ))}
                  </div>
                )}
                {rating.comment && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{rating.comment}</p>
                )}
                {rating.vendorResponse && (
                  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 p-4 rounded-r-lg">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-400 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {rating.vendorThanked ? 'Vendor thanked you' : 'Vendor Response'}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{rating.vendorResponse}</p>
                    {rating.vendorResponseDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(rating.vendorResponseDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
