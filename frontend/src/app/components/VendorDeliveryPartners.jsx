import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Edit2, Truck, Loader2, Phone, Mail, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useLang } from '../context/language';
import { ReviewModalPortal } from './ReviewModalPortal';

const emptyForm = { name: '', phone: '', email: '', notes: '' };

export function VendorDeliveryPartners() {
  const { t } = useLang();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPartners = async () => {
    try {
      const data = await api.vendor.getDeliveryPartners(true);
      setPartners(data);
    } catch {
      toast.error(t('err_load_delivery_partners'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (partner) => {
    setEditing(partner);
    setForm({
      name: partner.name,
      phone: partner.phone,
      email: partner.email || '',
      notes: partner.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.vendor.updateDeliveryPartner(editing._id, form);
        toast.success(t('delivery_partner_updated'));
      } else {
        await api.vendor.createDeliveryPartner(form);
        toast.success(t('delivery_partner_created'));
      }
      setModalOpen(false);
      fetchPartners();
    } catch (err) {
      toast.error(err.message || t('err_save_delivery_partner'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (partner) => {
    try {
      await api.vendor.updateDeliveryPartner(partner._id, { isActive: !partner.isActive });
      toast.success(partner.isActive ? t('delivery_partner_deactivated') : t('delivery_partner_activated'));
      fetchPartners();
    } catch (err) {
      toast.error(err.message || t('err_save_delivery_partner'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="animate-spin text-green-600 h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
            <Truck size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">{t('delivery_partners_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('delivery_partners_subtitle')}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl">
          <Plus size={18} />
          {t('delivery_partner_add')}
        </Button>
      </div>

      {partners.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-dashed">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('delivery_partners_empty')}</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((p) => (
            <Card
              key={p._id}
              className={`p-5 rounded-2xl border ${
                p.isActive
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                    <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                    <Badge
                      className={
                        p.isActive
                          ? 'bg-green-100 text-green-700 border-none text-[10px]'
                          : 'bg-gray-100 text-gray-500 border-none text-[10px]'
                      }
                    >
                      {p.isActive ? t('active') : t('inactive')}
                    </Badge>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                <Phone size={14} /> {p.phone}
              </p>
              {p.email && (
                <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3 truncate">
                  <Mail size={14} /> {p.email}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-xl mt-2"
                onClick={() => toggleActive(p)}
              >
                {p.isActive ? t('deactivate') : t('activate')}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <ReviewModalPortal open={modalOpen} onBackdropClose={saving ? undefined : () => setModalOpen(false)}>
        <Card
          className="w-full max-w-md rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-700 shadow-2xl relative z-[20101] bg-white dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg">
              {editing ? t('delivery_partner_edit') : t('delivery_partner_add')}
            </h3>
            <button type="button" onClick={() => setModalOpen(false)} className="p-1 hover:bg-white/20 rounded-lg">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <Label>{t('delivery_partner_name')}</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t('delivery_partner_phone')}</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1"
                maxLength={10}
              />
            </div>
            <div>
              <Label>{t('delivery_partner_email')}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t('delivery_partner_notes')}</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                {t('btn_cancel')}
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('btn_save')}
              </Button>
            </div>
          </form>
        </Card>
      </ReviewModalPortal>
    </div>
  );
}
