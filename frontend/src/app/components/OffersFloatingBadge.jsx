import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, X } from 'lucide-react';
import { useAuth } from '../context/auth';
import { useLang } from '../context/language';
import { api } from '../../lib/api';

const REFRESH_MS = 60_000;
const DISMISS_KEY = 'gc_offers_fab_dismissed';

export function OffersFloatingBadge() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [offerCount, setOfferCount] = useState(0);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1'
  );

  const isCustomer =
    user && user.role !== 'vendor' && user.role !== 'admin';

  useEffect(() => {
    if (!isCustomer) {
      setOfferCount(0);
      return undefined;
    }

    const load = async () => {
      try {
        const { count } = await api.coupons.getActiveCount();
        setOfferCount(typeof count === 'number' ? count : 0);
      } catch {
        setOfferCount(0);
      }
    };

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [isCustomer, user?._id]);

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  if (!isCustomer || offerCount <= 0 || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[45] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-800 text-white border-2 border-white dark:border-gray-600 shadow-md hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
        aria-label={t('offers_fab_close')}
      >
        <X className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <button
        type="button"
        onClick={() => navigate('/offers')}
        className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white pl-4 pr-5 py-3 shadow-lg shadow-green-500/30 hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95 transition-all"
        aria-label={t('offers_fab_label')}
      >
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Tag className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-950 px-1">
            {offerCount > 9 ? '9+' : offerCount}
          </span>
        </span>
        <span className="font-bold text-sm hidden sm:inline pr-1">
          {t('offers_fab_text')}
        </span>
      </button>
    </div>
  );
}
