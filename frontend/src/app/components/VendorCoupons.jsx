import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Loader2, Tag, Percent, IndianRupee, Calendar, CheckCircle2, AlertCircle, XCircle, X, Package, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useAuth } from '../context/auth';
import { useLang } from '../context/language';

export function VendorCoupons() {
  const { t } = useLang();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'cart',
    discountType: 'percentage',
    discountValue: '',
    minPurchase: '',
    maxDiscount: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    productId: '',
    usageLimit: ''
  });

  const fetchCoupons = async () => {
    try {
      const data = await api.coupons.getVendorCoupons();
      setCoupons(data);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error(t('err_load_coupons'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api.vendor.getProducts();
      setVendorProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate coupon fields
    if (!formData.code.trim()) {
      toast.error(t('err_coupon_code_required'));
      return;
    }
    if (formData.code.length < 3) {
      toast.error("Coupon code must be at least 3 characters!");
      return;
    }
    if (!formData.code.match(/^[A-Z0-9_]+$/)) {
      toast.error(t('err_coupon_code_format'));
      return;
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error("Discount value must be greater than 0!");
      return;
    }
    if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100) {
      toast.error("Percentage discount cannot be more than 100%!");
      return;
    }
    if (!formData.validFrom) {
      toast.error(t('err_valid_from_required'));
      return;
    }
    if (!formData.validUntil) {
      toast.error(t('err_valid_until_required'));
      return;
    }
    if (new Date(formData.validUntil) < new Date(formData.validFrom)) {
      toast.error(t('err_valid_until_before_from'));
      return;
    }
    if (formData.type === 'product' && !formData.productId) {
      toast.error("Please select a product for product-specific coupon!");
      return;
    }

    try {
      const couponData = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minPurchase: formData.minPurchase ? Number(formData.minPurchase) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : 0,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : 0,
        productId: formData.type === 'product' ? formData.productId : null
      };

      if (editingCoupon) {
        await api.coupons.update(editingCoupon._id, couponData);
        toast.success(t('err_coupon_saved'));
      } else {
        await api.coupons.create(couponData);
        toast.success(t('err_coupon_created'));
      }

      setIsModalOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error("Failed to save coupon:", error);
      toast.error(error.message || t('err_load_coupons'));
    }
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;
    try {
      await api.coupons.delete(couponToDelete._id);
      toast.success(t('err_coupon_deleted'));
      fetchCoupons();
      setIsDeleteModalOpen(false);
      setCouponToDelete(null);
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      toast.error(t('err_load_coupons'));
    }
  };

  const confirmDelete = (coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minPurchase: coupon.minPurchase?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
      validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
      productId: coupon.productId?._id || '',
      usageLimit: coupon.usageLimit?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'cart',
      discountType: 'percentage',
      discountValue: '',
      minPurchase: '',
      maxDiscount: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      productId: '',
      usageLimit: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'disabled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return CheckCircle2;
      case 'pending':
        return AlertCircle;
      case 'disabled':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        <p className="text-gray-500 dark:text-gray-400 font-medium ml-3 text-lg">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('vendor_coupons_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Create and manage discount coupons for your products</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-100 dark:shadow-none h-12 px-6 rounded-2xl font-bold text-white"
        >
          <Plus size={20} /> Create Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card className="p-16 border-none dark:bg-gray-800 shadow-lg text-center rounded-3xl">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center mx-auto mb-6">
            <Tag size={48} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">No coupons yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Create your first coupon to start offering discounts to your customers!</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => {
            const StatusIcon = getStatusIcon(coupon.status);
            return (
              <Card 
                key={coupon._id} 
                className="p-0 overflow-hidden border-none dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-3xl"
              >
                {/* Coupon Card Header with Gradient Background */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                      {coupon.discountType === 'percentage' ? (
                        <Percent size={32} className="text-white" />
                      ) : (
                        <IndianRupee size={32} className="text-white" />
                      )}
                    </div>
                    <Badge className={`${getStatusColor(coupon.status)} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20`}>
                      <StatusIcon size={12} />
                      {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-black">{coupon.code}</span>
                  </div>
                  <div className="mt-2">
                    {coupon.discountType === 'percentage' ? (
                      <span className="text-2xl font-black">{coupon.discountValue}% OFF</span>
                    ) : (
                      <span className="text-2xl font-black">₹{coupon.discountValue} OFF</span>
                    )}
                  </div>
                </div>

                {/* Coupon Card Body */}
                <div className="p-6 space-y-4">
                  {coupon.type === 'product' && coupon.productId && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Package size={16} />
                      <span>Applicable on {coupon.productId.name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar size={16} />
                    <span>
                      {new Date(coupon.validFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {coupon.minPurchase > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <IndianRupee size={16} />
                      <span>Min. purchase: ₹{coupon.minPurchase}</span>
                    </div>
                  )}

                  {coupon.usageLimit > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Users size={16} />
                      <span>Used {coupon.usageCount}/{coupon.usageLimit} times</span>
                    </div>
                  )}
                </div>

                {/* Coupon Card Footer with Action Buttons */}
                <div className="p-4 pt-0 flex gap-3 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl text-sm font-bold py-3"
                    onClick={() => handleEdit(coupon)}
                  >
                    <Edit2 size={18} /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 gap-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl text-sm font-bold py-3"
                    onClick={() => confirmDelete(coupon)}
                  >
                    <Trash2 size={18} /> Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 pt-10 pb-6 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <Card className="w-full max-w-5xl bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden my-4 md:my-auto animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-green-600 p-6 text-white flex justify-between items-center transition-colors sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black">{editingCoupon ? t('edit_coupon_modal_title') : t('create_coupon_modal_title')}</h2>
                <p className="text-green-100 text-base mt-1">
                  {editingCoupon ? t('edit_coupon_modal_sub') : t('create_coupon_modal_sub')}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-white hover:bg-white/10 rounded-full transition-colors">
                <X size={28} />
              </Button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-8 grid md:grid-cols-2 gap-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="md:col-span-2">
                <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Coupon Code</Label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white dark:placeholder-gray-500 text-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Coupon Type</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white"
                  >
                    <option value="cart" className="dark:bg-gray-800">Cart Coupon</option>
                    <option value="product" className="dark:bg-gray-800">Product Coupon</option>
                  </select>
                </div>

                <div>
                  <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Discount Type</Label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white"
                  >
                    <option value="percentage" className="dark:bg-gray-800">Percentage</option>
                    <option value="fixed" className="dark:bg-gray-800">Fixed Amount</option>
                  </select>
                </div>
              </div>

              {formData.type === 'product' && (
                <div className="md:col-span-2">
                  <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Select Product</Label>
                  <select
                    required={formData.type === 'product'}
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white"
                  >
                    <option value="" className="dark:bg-gray-800">Select a product</option>
                    {vendorProducts.map((product) => (
                      <option key={product._id} value={product._id} className="dark:bg-gray-800">
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Discount Value</Label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white dark:placeholder-gray-500 text-lg"
                  />
                </div>
                <div>
                  <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Minimum Purchase (Optional)</Label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    placeholder="0"
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white dark:placeholder-gray-500 text-lg"
                  />
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div className="md:col-span-2">
                  <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Maximum Discount (Optional)</Label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="0"
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white dark:placeholder-gray-500 text-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Valid From</Label>
                  <input
                    required
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white text-lg"
                  />
                </div>
                <div>
                  <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Valid Until</Label>
                  <input
                    required
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white text-lg"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2 block">Usage Limit (Optional, 0 for unlimited)</Label>
                <input
                  type="number"
                  min="0"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="0"
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium dark:text-white dark:placeholder-gray-500 text-lg"
                />
              </div>

              {/* Modal Footer */}
              <div className="md:col-span-2 flex gap-4 pt-4 border-t border-gray-50 dark:border-gray-700 transition-colors">
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-300 transition-all" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-[2] h-12 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 dark:shadow-none font-bold transition-all">
                  {editingCoupon ? t('update_coupon_btn') : t('create_coupon_btn')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isDeleteModalOpen && couponToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden">
            {/* Modal Header with Red Gradient */}
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-red-500 to-rose-500 text-white">
              <div className="flex items-center gap-3">
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Trash2 size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Delete Coupon</h3>
                  <p className="text-red-100 mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-100 dark:border-red-800">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to delete this coupon?
                </p>
                <div className="flex items-center gap-4 bg-white dark:bg-gray-700/50 rounded-xl p-4">
                  <Tag size={32} className="text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">
                      {couponToDelete.code}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {couponToDelete.discountType === 'percentage' ? (
                        `${couponToDelete.discountValue}% OFF`
                      ) : (
                        `₹${couponToDelete.discountValue} OFF`
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 h-12 text-lg font-bold rounded-2xl border border-gray-200 dark:border-gray-700"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCouponToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-lg font-bold rounded-2xl shadow-lg shadow-red-100 dark:shadow-none"
                  onClick={handleDelete}
                >
                  Delete Coupon
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
