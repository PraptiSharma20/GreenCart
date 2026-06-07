import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { categories, ALL_PRODUCTS_CATEGORY, LEGACY_CATEGORY_IDS } from '../data/products';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Loader2, X, Image as ImageIcon, Save, Heart } from 'lucide-react';
import { useCart } from '../context/cart';
import { toast } from 'sonner';
import { useLang } from '../context/language';
import { localizeCategoryLabel, localizeProduct } from '../i18n/productTranslations';
import { useAuth } from '../context/auth';
import { api } from '../../lib/api';
import { HERO_SLIDE_IMAGES } from '../data/heroSlides';
import { ProductRatingDisplay } from '../components/ProductRatingDisplay';

function productMatchesCategory(productCategory, selected) {
  if (selected === ALL_PRODUCTS_CATEGORY) return true;
  if (productCategory === selected) return true;
  if (LEGACY_CATEGORY_IDS[productCategory] === selected) return true;
  return false;
}

export function Home() {
  const { addToCart, items } = useCart();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const location = useLocation();
  const { user, toggleWishlist, isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('category');
    if (!fromUrl) return ALL_PRODUCTS_CATEGORY;
    return LEGACY_CATEGORY_IDS[fromUrl] || fromUrl;
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (user?.role === "vendor") {
          const data = await api.vendor.getProducts();
          const filtered = data.filter((p) =>
            productMatchesCategory(p.category, selectedCategory)
          );
          setProducts(filtered);
        } else {
          const filters = { category: selectedCategory };
          const data = await api.products.getAll(filters);
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, lang, user?.role]);

  const filteredProducts = products;

  const handleToggleWishlist = async (e, productId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      const updatedWishlist = await toggleWishlist(productId);
      const isNowWishlisted = updatedWishlist?.includes(productId);
      toast.success(isNowWishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (error) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  const [slide, setSlide] = useState(0);
  const slides = useMemo(
    () => [
      { title: t('hero_title'), sub: t('hero_slide_1_sub'), cta: t('hero_cta'), img: HERO_SLIDE_IMAGES[0] },
      { title: t('hero_slide_2_title'), sub: t('hero_slide_2_sub'), cta: t('hero_cta'), img: HERO_SLIDE_IMAGES[1] },
      { title: t('hero_slide_3_title'), sub: t('hero_slide_3_sub'), cta: t('hero_cta'), img: HERO_SLIDE_IMAGES[2] },
      { title: t('hero_slide_4_title'), sub: t('hero_slide_4_sub'), cta: t('hero_cta'), img: HERO_SLIDE_IMAGES[3] },
      { title: t('hero_slide_5_title'), sub: t('hero_slide_5_sub'), cta: t('hero_cta'), img: HERO_SLIDE_IMAGES[4] },
    ],
    [t]
  );

  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image();
      img.src = s.img;
    });
  }, [slides]);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) {
      setTimeout(() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }, [location.search]);



  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image: '', category: '', description: '', unit: 'per kg', inStock: true });
  const [addingProduct, setAddingProduct] = useState(false);

  const handleUploadNew = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewProduct((p) => ({ ...p, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const addNewProduct = async () => {
    if (!newProduct.name.trim()) {
      toast.error("Product name is required!");
      return;
    }
    if (newProduct.name.length < 2) {
      toast.error("Product name must be at least 2 characters!");
      return;
    }
    if (!newProduct.price || Number(newProduct.price) <= 0) {
      toast.error("Product price must be greater than 0!");
      return;
    }
    if (!newProduct.category) {
      toast.error("Product category is required!");
      return;
    }
    if (!newProduct.description.trim()) {
      toast.error("Product description is required!");
      return;
    }
    if (!newProduct.image.trim()) {
      toast.error("Product image is required! Please upload an image or paste an image URL!");
      return;
    }

    setAddingProduct(true);
    try {
      const obj = {
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        unit: newProduct.unit,
        image: newProduct.image,
        description: newProduct.description,
        inStock: newProduct.inStock,
      };
      const created = await api.products.create(obj);
      setProducts((prev) => [created, ...prev]);
      setShowAdd(false);
      setNewProduct({ name: '', price: '', image: '', category: '', description: '', unit: 'per kg', inStock: true });
      toast.success('Product added successfully!');
    } catch (error) {
      console.error("Failed to add product:", error);
      toast.error(error.message || "Failed to add product");
    } finally {
      setAddingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* Hero carousel — hidden for vendors */}
      {user?.role !== 'vendor' && (
        <section
          className="relative mb-6 mt-4 w-full overflow-hidden sm:mt-5 md:mt-6"
          aria-label="Featured offers"
          onTouchStart={(e) => {
            window.__touchX = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - (window.__touchX || 0);
            if (Math.abs(dx) > 50) {
              setSlide((s) =>
                dx > 0 ? (s - 1 + slides.length) % slides.length : (s + 1) % slides.length
              );
            }
          }}
          onMouseDown={(e) => {
            window.__mouseX = e.clientX;
          }}
          onMouseUp={(e) => {
            const dx = e.clientX - (window.__mouseX || 0);
            if (Math.abs(dx) > 50) {
              setSlide((s) =>
                dx > 0 ? (s - 1 + slides.length) % slides.length : (s + 1) % slides.length
              );
            }
          }}
        >
          <div className="relative h-[260px] sm:h-[300px] md:h-[340px] text-white">
            {slides.map((s, i) => (
              <img
                key={s.img}
                src={s.img}
                alt=""
                aria-hidden={i !== slide}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                  i === slide ? 'opacity-100' : 'opacity-0'
                }`}
                loading={i <= 1 ? 'eager' : 'lazy'}
                decoding="async"
              />
            ))}
            <div
              className="absolute inset-0 bg-gradient-to-r from-green-950/80 via-green-900/55 to-green-800/35"
              aria-hidden
            />
            <div className="relative z-10 flex h-full flex-col justify-center px-6 py-8 sm:px-10 md:px-12">
              <h1 className="mb-3 max-w-3xl text-3xl font-bold leading-tight drop-shadow-md sm:text-4xl md:text-5xl">
                {slides[slide].title}
              </h1>
              <p className="mb-5 max-w-2xl text-base opacity-95 drop-shadow sm:text-lg">
                {slides[slide].sub}
              </p>
              <div>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() =>
                    document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  {slides[slide].cta}
                </Button>
              </div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === slide ? 'true' : undefined}
                  onClick={() => setSlide(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i === slide ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto min-w-0 px-4 py-6 md:py-8">

      {user?.role === 'vendor' && (
        <div className="mb-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <h3 className="text-xl font-semibold mb-2">{t('vendor_manage_products')}</h3>
              <p className="opacity-90">{t('vendor_manage_products_desc')}</p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/vendor/dashboard?tab=products')}
                >
                  {t('vendor_go_to_products')}
                </Button>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <h3 className="text-xl font-semibold mb-2">{t('vendor_incoming_orders')}</h3>
              <p className="opacity-90">{t('vendor_incoming_orders_desc')}</p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/vendor/dashboard?tab=orders')}
                >
                  {t('vendor_go_to_orders')}
                </Button>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
              <h3 className="text-xl font-semibold mb-2">{t('vendor_sales_analytics')}</h3>
              <p className="opacity-90">{t('vendor_sales_analytics_desc')}</p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/vendor/dashboard?tab=analytics')}
                >
                  {t('vendor_view_analytics')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl dark:text-white transition-colors">
          {user?.role === 'vendor' ? t('vendor_filter_by_category') : t('shop_by_category')}
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap ${selectedCategory !== category ? 'dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800' : ''}`}
            >
              {localizeCategoryLabel(category, lang)}
            </Button>
          ))}
          {user?.role === 'vendor' && (
            <Button variant="outline" className="whitespace-nowrap flex items-center gap-1 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> {t('add')}
            </Button>
          )}
        </div>
      </div>

      {showAdd && user?.role === 'vendor' && (
        <Card className="mb-6 p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors">
          <h3 className="mb-4 text-xl dark:text-white">{t('add_new_product')}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
              <input className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all dark:text-white dark:placeholder-gray-500" placeholder={t('product_name')} value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Price (₹)</label>
                <input className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all dark:text-white dark:placeholder-gray-500" placeholder={t('price')} type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit</label>
                <select 
                  className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all dark:text-white" 
                  value={newProduct.unit} 
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                >
                  <option value="per kg" className="dark:bg-gray-800">per kg</option>
                  <option value="per piece" className="dark:bg-gray-800">per piece</option>
                  <option value="per bag" className="dark:bg-gray-800">per bag</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image URL</label>
              <input className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all dark:text-white dark:placeholder-gray-500" placeholder={t('image_url')} value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Image</label>
              <input className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/30 dark:file:text-green-400" type="file" accept="image/*" onChange={(e) => handleUploadNew(e.target.files?.[0])} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select 
                className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all dark:text-white" 
                value={newProduct.category} 
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              >
                <option value="" className="dark:bg-gray-800">Select category...</option>
                {categories.filter(cat => cat !== ALL_PRODUCTS_CATEGORY).map(cat => (
                  <option key={cat} value={cat} className="dark:bg-gray-800">
                    {localizeCategoryLabel(cat, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock Status</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {newProduct.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                <button
                  type="button"
                  onClick={() => setNewProduct({ ...newProduct, inStock: !newProduct.inStock })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ${
                    newProduct.inStock ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                      newProduct.inStock ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea 
                rows={3}
                className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all dark:text-white dark:placeholder-gray-500 resize-none" 
                placeholder={t('description')} 
                value={newProduct.description} 
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} 
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl dark:border-gray-700 dark:text-gray-300" onClick={() => setShowAdd(false)}>{t('cancel')}</Button>
            <Button className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold" onClick={addNewProduct}>
              {addingProduct ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Adding...</> : t('save_changes')}
            </Button>
          </div>
        </Card>
      )}

      {/* Products Grid */}
      <div id="products-grid" className="mb-8">
        <h2 className="mb-4 text-2xl dark:text-white transition-colors">
          {selectedCategory === ALL_PRODUCTS_CATEGORY
            ? t('all_products')
            : localizeCategoryLabel(selectedCategory, lang)}
        </h2>
        <div id="products-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
          {filteredProducts.map((p) => {
            const product = localizeProduct(p, lang);
            const unitMap = {
              'per kg': t('per_kg'),
              'per piece': t('per_piece'),
              'per bag': t('per_bag'),
              'per 5kg bag': t('per_5kg_bag'),
              'each': t('each'),
            };
            const unitText = unitMap[p.unit] || p.unit;
            const productId = p._id || p.id;
            const inCart = items.find(i => (i.product?._id || i.product?.id || i._id || i.id) === productId)?.quantity || 0;
            const isOwnProduct = user?.role === 'vendor' && (p.vendor === user.id || p.vendor?._id === user.id || p.vendor === user._id);
            const isWishlisted = user?.wishlist?.includes(productId);

            return (
            <Card key={productId} className="overflow-hidden hover:shadow-lg transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 group">
              <div
                className="relative h-48 cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-700"
                onClick={() => navigate(`/product/${productId}`)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {product.inStock ? (
                  <Badge className="absolute top-2 left-2 bg-green-600 border-none shadow-sm">{t('in_stock')}</Badge>
                ) : (
                  <Badge className="absolute top-2 left-2 bg-red-600 border-none shadow-sm">{t('out_of_stock')}</Badge>
                )}
                {user?.role !== 'vendor' && (
                  <button
                    onClick={(e) => handleToggleWishlist(e, productId)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm"
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
                    />
                  </button>
                )}
              </div>
              <CardContent className="p-4">
                <h3
                  className="mb-1 text-lg font-bold cursor-pointer hover:text-green-600 dark:text-white dark:hover:text-green-400 capitalize transition-colors"
                  onClick={() => navigate(`/product/${productId}`)}
                >
                  {product.name}
                </h3>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors">
                  {product.vendorName && String(product.vendorName).length > 24
                    ? t('green_cart_vendor')
                    : product.vendor || t('green_cart_vendor')}
                </p>
                {!isOwnProduct && (
                  <div className="mb-2">
                    <ProductRatingDisplay
                      rating={p.rating || 0}
                      reviewCount={p.reviews || 0}
                      size="sm"
                    />
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-green-700 dark:text-green-500 transition-colors">₹{product.price.toFixed(2)}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium transition-colors">/ {unitText}</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                {isOwnProduct ? (
                  <Button 
                    variant="outline" 
                    className="w-full h-11 rounded-xl font-bold border-gray-200 dark:border-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/vendor/dashboard?tab=products&edit=${productId}`);
                    }}
                  >
                    {t('edit_product')}
                  </Button>
                ) : (
                  <Button
                    className={`w-full h-11 rounded-xl font-bold transition-all ${
                      inCart > 0 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100' 
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100 dark:shadow-none'
                    }`}
                    onClick={() => {
                      if (inCart > 0) {
                        navigate('/cart');
                      } else {
                        addToCart(product, 1);
                      }
                    }}
                  >
                    {inCart > 0 ? (
                      <span className="flex items-center gap-2">
                        {t('go_to_cart')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> {t('add_to_cart')}
                      </span>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )})}
        </div>
      </div>



      {/* Features Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-12">
        <Card className="text-center p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 transition-colors">
              <span className="text-3xl">🚚</span>
            </div>
          </div>
          <h3 className="mb-2 text-xl dark:text-white transition-colors">{t('features_fast')}</h3>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">{t('features_fast_sub')}</p>
        </Card>
        <Card className="text-center p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 transition-colors">
              <span className="text-3xl">🌱</span>
            </div>
          </div>
          <h3 className="mb-2 text-xl dark:text-white transition-colors">{t('features_fresh')}</h3>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">{t('features_fresh_sub')}</p>
        </Card>
        <Card className="text-center p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 transition-colors">
              <span className="text-3xl">💰</span>
            </div>
          </div>
          <h3 className="mb-2 text-xl dark:text-white transition-colors">{t('features_prices')}</h3>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">{t('features_prices_sub')}</p>
        </Card>
      </div>
      </div>
    </div>
  );
}