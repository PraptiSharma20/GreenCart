import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Star, Plus, Loader2, Heart } from 'lucide-react';
import { useCart } from '../context/cart';
import { toast } from 'sonner';
import { useLang } from '../context/language';
import { localizeProduct } from '../i18n/productTranslations';
import { useAuth } from '../context/auth';
import { api } from '../../lib/api';

export function Wishlist() {
  const { addToCart, items } = useCart();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { user, toggleWishlist, syncWishlist, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.auth.getWishlist();
        setWishlist(data);
        syncWishlist(data);
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
        toast.error("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [isAuthenticated, syncWishlist]); // Remove dependency on user.wishlist.length to avoid loops

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl dark:text-white">Please login to view your wishlist</h1>
        <Button onClick={() => navigate('/login')}>Login</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const handleToggleWishlist = async (productId) => {
    try {
      await toggleWishlist(productId);
      setWishlist(prev => prev.filter(p => (p._id || p.id) !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold dark:text-white">My Wishlist</h1>
      
      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-2xl font-semibold mb-2 dark:text-white">Your wishlist is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Browse products and add them to your wishlist</p>
          <Button onClick={() => navigate('/')}>Continue Shopping</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map(product => {
            const localizedProduct = localizeProduct(product, lang);
            const productId = product._id || product.id;
            const inCart = items.find(i => (i.product?._id || i.product?.id || i._id || i.id) === productId)?.quantity || 0;

            return (
              <Card key={productId} className="overflow-hidden hover:shadow-lg transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 group">
                <div
                  className="relative h-40 cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-700"
                  onClick={() => navigate(`/product/${productId}`)}
                >
                  <img
                    src={localizedProduct.image}
                    alt={localizedProduct.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {localizedProduct.inStock ? (
                    <Badge className="absolute top-2 left-2 bg-green-600">In Stock</Badge>
                  ) : (
                    <Badge className="absolute top-2 left-2 bg-red-600">Out of Stock</Badge>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleWishlist(productId);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm"
                  >
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </button>
                </div>
                <CardContent className="p-4">
                  <h3
                    className="mb-1 text-lg font-bold cursor-pointer hover:text-green-600 dark:text-white dark:hover:text-green-400 capitalize transition-colors"
                    onClick={() => navigate(`/product/${productId}`)}
                  >
                    {localizedProduct.name}
                  </h3>
                  <div className="mb-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(localizedProduct.rating || 4.5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      />
                    ))}
                    <span className="text-sm font-bold dark:text-gray-200 transition-colors ml-2">{(localizedProduct.rating || 4.5).toFixed(1)}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-green-700 dark:text-green-500 transition-colors">₹{localizedProduct.price.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className={`w-full h-11 rounded-xl font-bold transition-all ${
                      inCart > 0 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100' 
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100 dark:shadow-none'
                    }`}
                    onClick={() => {
                      if (inCart > 0) {
                        // If already in cart, remove from wishlist and go to cart
                        handleToggleWishlist(productId);
                        navigate('/cart');
                      } else {
                        // If not in cart, add to cart and remove from wishlist
                        addToCart(localizedProduct, 1);
                        handleToggleWishlist(productId);
                      }
                    }}
                  >
                    {inCart > 0 ? (
                      <span className="flex items-center gap-2">
                        Go to Cart
                      </span>
                    ) : (
                      t('add_to_cart')
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
