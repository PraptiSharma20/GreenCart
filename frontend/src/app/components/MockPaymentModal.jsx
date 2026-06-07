import React, { useState, useEffect } from 'react';
import { X, CreditCard, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLang } from '../context/language';

export function MockPaymentModal({ isOpen, onClose, onSuccess, amount }) {
  const { t } = useLang();
  const [step, setStep] = useState('details'); // details, processing, success
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/26');
  const [cvv, setCvv] = useState('123');

  useEffect(() => {
    if (isOpen) {
      setStep('details');
    }
  }, [isOpen]);

  const handlePay = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess({
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).slice(2, 11)}`,
          razorpay_order_id: `order_mock_${Math.random().toString(36).slice(2, 11)}`,
          razorpay_signature: 'mock_signature'
        });
      }, 1500);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md overflow-hidden shadow-2xl rounded-3xl border-none animate-in zoom-in-95 duration-300">
        {step === 'details' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-xl text-green-600 dark:text-green-400">
                  <CreditCard size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('payment_secure')}</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('payment_amount')}</p>
              <p className="text-3xl font-black text-green-600">₹{amount.toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('card_number')}</Label>
                <Input 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="rounded-xl border-gray-200 py-6 font-mono text-lg"
                  placeholder="0000 0000 0000 0000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('card_expiry')}</Label>
                  <Input 
                    value={expiry} 
                    onChange={(e) => setExpiry(e.target.value)}
                    className="rounded-xl border-gray-200 py-6 font-mono"
                    placeholder="MM/YY"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('card_cvv')}</Label>
                  <Input 
                    type="password"
                    value={cvv} 
                    onChange={(e) => setCvv(e.target.value)}
                    className="rounded-xl border-gray-200 py-6 font-mono"
                    placeholder="***"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePay}
              className="w-full mt-8 rounded-2xl py-8 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg shadow-green-200 transition-all active:scale-[0.98]"
            >
              {t('pay_now')}
            </Button>

            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
              <ShieldCheck size={16} />
              <span className="text-xs font-medium">{t('payment_ssl')}</span>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="h-24 w-24 rounded-full border-4 border-green-100"></div>
              <Loader2 className="absolute inset-0 h-24 w-24 text-green-600 animate-spin stroke-[3px]" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('payment_processing')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('payment_wait')}</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
            <div className="h-24 w-24 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-8">
              <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('payment_success')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('payment_success_desc')}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
