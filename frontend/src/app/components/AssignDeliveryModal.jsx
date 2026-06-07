import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Truck, Loader2, User, Phone, Mail } from 'lucide-react';
import { ReviewModalPortal } from './ReviewModalPortal';
import { api } from '../../lib/api';
import { useLang } from '../context/language';
import { toast } from 'sonner';

export function AssignDeliveryModal({ order, isOpen, onClose, onSuccess }) {
  const { t } = useLang();
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({
    partnerName: '',
    partnerPhone: '',
    partnerEmail: '',
    notes: '',
    savePartner: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    setLoadingPartners(true);
    api.vendor
      .getDeliveryPartners()
      .then(setPartners)
      .catch(() => setPartners([]))
      .finally(() => setLoadingPartners(false));
    setSelectedId('');
    setForm({
      partnerName: '',
      partnerPhone: '',
      partnerEmail: '',
      notes: '',
      savePartner: true,
    });
  }, [isOpen]);

  const applyPartner = (partner) => {
    if (!partner) return;
    setSelectedId(partner._id);
    setForm({
      partnerName: partner.name,
      partnerPhone: partner.phone,
      partnerEmail: partner.email || '',
      notes: partner.notes || '',
      savePartner: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;
    setSubmitting(true);
    try {
      const payload = selectedId
        ? {
            deliveryPartnerId: selectedId,
            notes: form.notes,
          }
        : {
            partnerName: form.partnerName.trim(),
            partnerPhone: form.partnerPhone.trim(),
            partnerEmail: form.partnerEmail.trim(),
            notes: form.notes.trim(),
            savePartner: form.savePartner,
          };

      await api.vendor.dispatchOrder(order._id, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || t('err_dispatch_order'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  const orderShortId = (order._id || order.id)?.toString()?.slice(-6).toUpperCase();

  return (
    <ReviewModalPortal open={isOpen} onBackdropClose={submitting ? undefined : onClose}>
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-2xl relative z-[20101] bg-white dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 text-white flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6" />
            <div>
              <p className="text-sm opacity-90">#{orderShortId}</p>
              <h2 className="text-xl font-bold">{t('dispatch_assign_title')}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('dispatch_assign_hint')}</p>

            {!loadingPartners && partners.length > 0 && (
              <div className="space-y-2">
                <Label>{t('dispatch_select_partner')}</Label>
                <div className="flex flex-wrap gap-2">
                  {partners.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => applyPartner(p)}
                      className={`text-left text-xs rounded-xl px-3 py-2 border-2 transition-colors ${
                        selectedId === p._id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <span className="font-bold block text-gray-900 dark:text-white">{p.name}</span>
                      <span className="text-gray-500">{p.phone}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {selectedId ? t('dispatch_partner_details') : t('dispatch_new_partner')}
              </p>
              <div>
                <Label htmlFor="dp-name">{t('delivery_partner_name')}</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="dp-name"
                    required={!selectedId}
                    disabled={Boolean(selectedId) || submitting}
                    value={form.partnerName}
                    onChange={(e) => setForm((f) => ({ ...f, partnerName: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dp-phone">{t('delivery_partner_phone')}</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="dp-phone"
                    required={!selectedId}
                    disabled={Boolean(selectedId) || submitting}
                    value={form.partnerPhone}
                    onChange={(e) => setForm((f) => ({ ...f, partnerPhone: e.target.value }))}
                    className="pl-10"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dp-email">{t('delivery_partner_email')}</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="dp-email"
                    type="email"
                    disabled={Boolean(selectedId) || submitting}
                    value={form.partnerEmail}
                    onChange={(e) => setForm((f) => ({ ...f, partnerEmail: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              {!selectedId && (
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={form.savePartner}
                    onChange={(e) => setForm((f) => ({ ...f, savePartner: e.target.checked }))}
                    className="accent-indigo-600"
                  />
                  {t('dispatch_save_partner')}
                </label>
              )}
            </div>
          </div>

          <div className="p-6 border-t dark:border-gray-700 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
              {t('btn_cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                t('dispatch_confirm_btn')
              )}
            </Button>
          </div>
        </form>
      </Card>
    </ReviewModalPortal>
  );
}
