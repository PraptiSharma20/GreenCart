import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Search, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/language';

export function AdminProducts() {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.products.getAll();
      setProducts(data);
    } catch (error) {
      toast.error(t('err_load_products'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm(t('confirm_delete_product'))) return;
    try {
      await api.products.delete(id);
      toast.success(t('err_product_deleted'));
      fetchProducts();
    } catch (error) {
      toast.error(t('err_delete_product'));
    }
  };

  const handleToggleStock = async (product) => {
    try {
      await api.products.update(product._id, { inStock: !product.inStock });
      toast.success(!product.inStock ? t('product_marked_in') : t('product_marked_out'));
      fetchProducts();
    } catch (error) {
      toast.error(t('err_update_product'));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('product_management')}</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder={t('search_products_admin')} 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <Card key={product._id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-none shadow-sm">
            <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700">
              <img 
                src={product.image?.startsWith('http') ? product.image : `http://localhost:5000${product.image}`} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2">
                <Badge className="bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white backdrop-blur-sm border-none shadow-sm">
                  {product.category}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  {t('by_vendor')} <span className="font-medium text-green-600 dark:text-green-400">{product.vendor?.name || t('unknown_vendor')}</span>
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="font-bold text-lg text-gray-900 dark:text-white">₹{product.price}</span>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`text-xs font-bold ${product.inStock ? 'text-green-600' : 'text-orange-600'}`}
                    onClick={() => handleToggleStock(product)}
                  >
                    {product.inStock ? t('in_stock_label') : t('out_of_stock_label')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={() => handleDeleteProduct(product._id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
