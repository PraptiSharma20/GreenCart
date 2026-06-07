import { useState, useEffect } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { api } from '../../../lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { AdminPanelShell } from './AdminPanelShell';
import { useLang } from '../../context/language';

export function AdminReviews() {
  const { t } = useLang();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setReviews(await api.admin.getReviews());
    } catch {
      toast.error(t('err_load_reviews'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.admin.deleteReview(toDelete.productId, toDelete.ratingId);
      toast.success(t('review_removed'));
      setToDelete(null);
      load();
    } catch {
      toast.error(t('err_remove_review'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminPanelShell
        title={t('admin_reviews')}
        subtitle={t('admin_reviews_desc')}
        icon={Star}
        loading={loading}
      >
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <Card className="p-8 text-center text-slate-500 rounded-2xl">{t('no_reviews_admin')}</Card>
          ) : (
            reviews.map((r) => (
              <Card key={`${r.productId}-${r.ratingId}`} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{r.productName}</p>
                    <p className="text-sm text-slate-500">
                      {r.customerName} · {r.vendorName} · {'★'.repeat(r.rating)}
                    </p>
                    {r.comment && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{r.comment}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(r.ratedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 shrink-0"
                    onClick={() => setToDelete(r)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </AdminPanelShell>
      <ConfirmDialog
        isOpen={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={confirmDelete}
        closeOnConfirm={false}
        isLoading={deleting}
        title={t('review_delete_title')}
        message={t('review_delete_msg')}
        detail={
          toDelete
            ? { label: t('product'), value: toDelete.productName, sub: toDelete.comment?.slice(0, 80) }
            : null
        }
        confirmText={t('query_delete')}
        cancelText={t('cancel')}
        variant="danger"
      />
    </>
  );
}
