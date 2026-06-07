import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useLang } from '../context/language';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Loader2, X, Upload, Search, Filter, MoreVertical, Eye, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { categories as allCategories, ALL_PRODUCTS_CATEGORY, LEGACY_CATEGORY_IDS } from '../data/products';

export function VendorProducts() {
  const { t, tCategory, localize } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const dismissedEditIdRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [stockFilter, setStockFilter] = useState('All'); // 'All', 'In Stock', 'Out of Stock'
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState(''); // '', '1', '2', '3', '4'

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'per kg',
    category: 'Vegetables',
    image: '',
    inStock: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const clearEditQueryParam = () => {
    const params = new URLSearchParams(location.search);
    if (!params.has('edit')) return;
    const editId = params.get('edit');
    if (editId) dismissedEditIdRef.current = editId;
    params.delete('edit');
    const search = params.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '' },
      { replace: true }
    );
  };

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const editId = p.get('edit');
    if (!editId) {
      dismissedEditIdRef.current = null;
      return;
    }
    if (products.length === 0) return;
    if (dismissedEditIdRef.current === editId) return;

    const productToEdit = products.find((prod) => {
      const pid = (prod._id || prod.id)?.toString();
      return pid === editId;
    });
    if (productToEdit) {
      handleEdit(productToEdit);
    }
  }, [location.search, products]);

  const fetchProducts = async () => {
    try {
      const data = await api.vendor.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error(t('err_load_products'));
    } finally {
      setLoading(false);
    }
  };

  // Category chips exclude the “all products” filter id
  const productCategories = allCategories.filter(cat => cat !== ALL_PRODUCTS_CATEGORY);
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'All' ||
      p.category === categoryFilter ||
      LEGACY_CATEGORY_IDS[p.category] === categoryFilter;
    const matchesStock = 
      stockFilter === 'All' || 
      (stockFilter === 'In Stock' && p.inStock) || 
      (stockFilter === 'Out of Stock' && !p.inStock);
    const matchesMinPrice = !minPriceFilter || p.price >= Number(minPriceFilter);
    const matchesMaxPrice = !maxPriceFilter || p.price <= Number(maxPriceFilter);
    const matchesRating = !minRatingFilter || (p.rating && p.rating >= Number(minRatingFilter));
    
    return matchesSearch && matchesCategory && matchesStock && matchesMinPrice && matchesMaxPrice && matchesRating;
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    setUploading(true);
    try {
      const res = await api.vendor.uploadImage(data);
      setFormData({ ...formData, image: res.image });
      toast.success(t('err_image_upload_success'));
    } catch (error) {
      toast.error(t('err_image_upload_fail'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate product fields
    if (!formData.name.trim()) {
      toast.error(t('err_product_name_req'));
      return;
    }
    if (formData.name.length < 2) {
      toast.error(t('err_product_name_min'));
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error(t('err_product_price_positive'));
      return;
    }
    if (!formData.category) {
      toast.error(t('err_product_category_req'));
      return;
    }
    if (!formData.description.trim()) {
      toast.error(t('err_product_description_req'));
      return;
    }
    if (!formData.image.trim()) {
      toast.error(t('err_product_image_req'));
      return;
    }

    try {
      const id = editingProduct?._id || editingProduct?.id;
      const payload = {
        ...formData,
        price: Number(formData.price)
      };
      if (editingProduct && id) {
        await api.products.update(id, payload);
        toast.success(t('err_product_updated_toast'));
      } else {
        await api.products.create(payload);
        toast.success(t('err_product_created_toast'));
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error(error.message || t('err_save_product'));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    resetForm();
    clearEditQueryParam();
  };

  const handleEdit = (product) => {
    if (!product) return;
    setEditingProduct(product);
    
    // Safety check for category to ensure it matches one of our options
    const validCategories = ["Vegetables", "Fruits", "Grains", "Dairy", "Root Vegetables", "Leafy Greens", "Green Vegetables", "Seasonal Products", "Seasonal Vegetables"];
    const category = validCategories.includes(product.category) ? product.category : "Vegetables";

    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      unit: product.unit || 'per kg',
      category: category,
      image: product.image || '',
      inStock: product.inStock !== undefined ? product.inStock : true
    });
    setIsModalOpen(true);
  };

  const handleToggleStock = async (product) => {
    try {
      const id = product._id || product.id;
      const updatedProduct = await api.products.update(id, {
        ...product,
        inStock: !product.inStock
      });
      // Update the local state to reflect the change
      setProducts(prev => prev.map(p => (p._id || p.id) === id ? updatedProduct : p));
      toast.success(!product.inStock ? t('product_marked_in_stock') : t('product_marked_out_stock'));
    } catch (error) {
      toast.error(error.message || t('err_stock_update'));
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      const id = productToDelete._id || productToDelete.id;
      await api.products.delete(id);
      toast.success(t('err_product_deleted'));
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      toast.error(t('err_delete_product'));
    }
  };

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      unit: 'per kg',
      category: 'Vegetables',
      image: '',
      inStock: true
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 space-y-4">
      <Loader2 className="animate-spin text-green-600 h-10 w-10" />
      <p className="text-gray-500 font-medium">{t('loading_inventory')}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{t('manage_products')}</h2>
          <p className="text-gray-500 dark:text-gray-400 transition-colors">{t('manage_products_catalog_desc')}</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingProduct(null); setIsModalOpen(true); }} className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 dark:shadow-none h-12 px-6 rounded-xl transition-all">
          <Plus size={20} /> {t('add_new_product')}
        </Button>
      </div>

      <Card className="p-4 border-none shadow-sm bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={t('search_products_vendor')} 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition-all dark:text-white dark:placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all dark:text-white"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All" className="dark:bg-gray-800">{t('all_categories')}</option>
              {productCategories.map(cat => (
                <option key={cat} value={cat} className="dark:bg-gray-800">{tCategory(cat)}</option>
              ))}
            </select>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-all ${showFilters ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400' : ''}`}
            >
              <Filter size={18} className="mr-2" /> {t('filters_label')}
            </Button>
          </div>
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stock Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('stock_status_filter')}</Label>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all dark:text-white"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="All" className="dark:bg-gray-800">{t('filter_all_option')}</option>
                  <option value="In Stock" className="dark:bg-gray-800">{t('in_stock_label')}</option>
                  <option value="Out of Stock" className="dark:bg-gray-800">{t('out_of_stock_label')}</option>
                </select>
              </div>

              {/* Min Price Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('min_price_label')}</Label>
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all dark:text-white dark:placeholder-gray-500"
                  value={minPriceFilter}
                  onChange={(e) => setMinPriceFilter(e.target.value)}
                />
              </div>

              {/* Max Price Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('max_price_label')}</Label>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all dark:text-white dark:placeholder-gray-500"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(e.target.value)}
                />
              </div>

              {/* Min Rating Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min Rating</Label>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all dark:text-white"
                  value={minRatingFilter}
                  onChange={(e) => setMinRatingFilter(e.target.value)}
                >
                  <option value="" className="dark:bg-gray-800">All Ratings</option>
                  <option value="1" className="dark:bg-gray-800">1+ Stars</option>
                  <option value="2" className="dark:bg-gray-800">2+ Stars</option>
                  <option value="3" className="dark:bg-gray-800">3+ Stars</option>
                  <option value="4" className="dark:bg-gray-800">4+ Stars</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-6 flex justify-end">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setStockFilter('All');
                  setMinPriceFilter('');
                  setMaxPriceFilter('');
                  setMinRatingFilter('');
                  setCategoryFilter('All');
                  setSearchTerm('');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X size={16} className="mr-2" /> {t('clear_all_filters')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {filteredProducts.length === 0 ? (
        <Card className="p-24 text-center border-none shadow-sm bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
            <Package size={32} className="text-gray-300 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('no_products_found')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('no_products_try_desc')}</p>
          <Button variant="link" className="text-green-600 dark:text-green-500 mt-4" onClick={() => {setSearchTerm(''); setCategoryFilter('All');}}>
            {t('clear_all_filters')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((rawProduct) => {
            const product = localize(rawProduct);
            return (
            <Card key={product._id || product.id} className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col dark:bg-gray-800">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={product.image?.startsWith('http') ? product.image : `http://localhost:5000${product.image}`} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <Button size="icon" variant="secondary" className="rounded-full w-10 h-10 text-red-600 shadow-lg" onClick={(e) => { e.stopPropagation(); confirmDelete(rawProduct); }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
                <Badge className="absolute top-3 left-3 border-none shadow-sm bg-green-500">
                  {product.inStock ? t('in_stock_label') : t('out_of_stock_label')}
                </Badge>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 mb-1 block transition-colors">{tCategory(rawProduct.category)}</span>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 transition-colors">{product.name}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 transition-colors">{product.description || t('no_description')}</p>
                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('price')}</span>
                    <span className="text-xl font-black text-green-600 dark:text-green-500 transition-colors">₹{product.price}<span className="text-xs font-medium text-gray-400 dark:text-gray-500 ml-1">/{product.unit}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Quick Stock Toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleStock(rawProduct); }}
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        product.inStock 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                      }`}
                      title={product.inStock ? t('mark_out_of_stock_btn') : t('mark_in_stock_btn')}
                    >
                      {product.inStock ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      )}
                    </button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors" onClick={() => handleEdit(rawProduct)}>
                      <Edit2 size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );})}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[110] p-4 pt-16 pb-8 overflow-y-auto animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-8 text-center border-none shadow-2xl animate-in zoom-in-95 duration-300 dark:bg-gray-800 my-auto">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
              <AlertTriangle size={40} className="text-red-600 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 transition-colors">Delete Product?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 transition-colors">
              Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{productToDelete?.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-300 transition-all" onClick={() => setIsDeleteModalOpen(false)}>No, Keep it</Button>
              <Button className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-100 dark:shadow-none transition-all" onClick={handleDelete}>Yes, Delete Now</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[100] p-4 pt-10 pb-6 animate-in fade-in duration-300 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <Card className="w-full max-w-5xl p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-300 dark:bg-gray-800 my-4 md:my-auto">
            <div className="bg-green-600 p-6 text-white flex justify-between items-center transition-colors sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black">{editingProduct ? t('edit_product') : t('add_new_product')}</h2>
                <p className="text-green-100 text-base mt-1">Fill in the details to update your catalog.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal} className="text-white hover:bg-white/10 rounded-full transition-colors">
                <X size={28} />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid md:grid-cols-2 gap-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">Product Name</Label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Fresh Spinach"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white dark:placeholder-gray-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">Price (₹)</Label>
                    <input 
                      required
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white dark:placeholder-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">Unit</Label>
                    <select 
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white"
                    >
                      <option value="per kg" className="dark:bg-gray-800">per kg</option>
                      <option value="per piece" className="dark:bg-gray-800">per piece</option>
                      <option value="per bag" className="dark:bg-gray-800">per bag</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">Category</Label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white"
                  >
                    {["Vegetables", "Fruits", "Grains", "Dairy", "Root Vegetables", "Leafy Greens", "Green Vegetables", "Seasonal Products"].map((cat) => (
                      <option key={cat} value={cat} className="dark:bg-gray-800">{tCategory(cat)}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Status Toggle */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">Stock Status</Label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formData.inStock ? t('in_stock_label') : t('out_of_stock_label')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, inStock: !formData.inStock})}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ${
                        formData.inStock ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                          formData.inStock ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">Product Image</Label>
                  <div className="flex flex-col gap-3">
                    <div className="relative group">
                      <input 
                        value={formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                        placeholder={t('paste_image_url')}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white dark:placeholder-gray-500"
                      />
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        id="image-upload"
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <label 
                        htmlFor="image-upload"
                        className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
                      >
                        {uploading ? <Loader2 size="18" className="animate-spin text-green-600" /> : <Upload size="18" className="text-gray-400 group-hover:text-green-600" />}
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-green-600">Upload File</span>
                      </label>
                    </div>
                    {formData.image && (
                      <div className="relative h-32 w-full rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
                        <img src={formData.image.startsWith('http') ? formData.image : `http://localhost:5000${formData.image}`} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">Description</Label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={t('product_desc_placeholder')}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-green-500 transition-all font-medium resize-none dark:text-white dark:placeholder-gray-500"
                />
              </div>

              <div className="md:col-span-2 flex gap-4 pt-4 border-t border-gray-50 dark:border-gray-700 transition-colors">
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-300 transition-all" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="flex-[2] h-12 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 dark:shadow-none font-bold transition-all">
                  {editingProduct ? t('save_changes') : t('create_product_btn')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
