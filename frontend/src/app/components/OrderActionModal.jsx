import { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useLang } from '../context/language';
import {
  CANCEL_REASONS,
  RETURN_REASONS,
  CANCEL_FOLLOW_UP,
  RETURN_FOLLOW_UP,
} from '../constants/orderActionFlows';

export function OrderActionModal({ isOpen, actionType, order, onClose, onSubmit }) {
  const { t } = useLang();
  const reasons = actionType === 'cancel' ? CANCEL_REASONS : RETURN_REASONS;
  const followUps = actionType === 'cancel' ? CANCEL_FOLLOW_UP : RETURN_FOLLOW_UP;

  const [step, setStep] = useState(0);
  const [reasonCode, setReasonCode] = useState('');
  const [answers, setAnswers] = useState({});
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reasonLabel = useMemo(
    () => reasons.find((r) => r.code === reasonCode)?.label || '',
    [reasonCode, reasons]
  );

  const totalSteps = 1 + followUps.length + 1;
  const isReasonStep = step === 0;
  const isFollowUpStep = step > 0 && step <= followUps.length;
  const isConfirmStep = step === totalSteps - 1;
  const currentFollowUp = isFollowUpStep ? followUps[step - 1] : null;

  if (!isOpen || !order) return null;

  const reset = () => {
    setStep(0);
    setReasonCode('');
    setAnswers({});
    setComments('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validateStep = () => {
    if (isReasonStep && !reasonCode) {
      setError(t('action_select_reason'));
      return false;
    }
    if (isFollowUpStep && currentFollowUp?.required) {
      const val = answers[currentFollowUp.id];
      if (!val?.trim()) {
        setError(t('action_answer_required'));
        return false;
      }
      if (
        actionType === 'cancel' &&
        currentFollowUp.id === 'confirm_cancel' &&
        val === 'No, keep my order'
      ) {
        setError(t('action_cancel_aborted'));
        return false;
      }
    }
    setError('');
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const questionnaire = followUps.map((q) => ({
        question: q.question,
        answer: answers[q.id] || '',
      }));
      await onSubmit({
        reasonCode,
        reasonLabel,
        additionalComments: comments,
        questionnaire,
      });
      reset();
    } catch (err) {
      setError(err.message || t('action_submit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const orderShortId = (order._id || order.id).toString().slice(-6).toUpperCase();

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border-0 shadow-2xl">
        <div
          className={`px-6 py-4 text-white flex items-center justify-between ${
            actionType === 'cancel'
              ? 'bg-gradient-to-r from-red-500 to-rose-600'
              : 'bg-gradient-to-r from-orange-500 to-amber-600'
          }`}
        >
          <div>
            <p className="text-sm opacity-90">Order #{orderShortId}</p>
            <h2 className="text-xl font-bold">
              {actionType === 'cancel' ? t('action_cancel_title') : t('action_return_title')}
            </h2>
          </div>
          <button type="button" onClick={handleClose} className="p-2 rounded-full hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('action_step').replace('{current}', String(step + 1)).replace('{total}', String(totalSteps))}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {isReasonStep && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('action_reason_prompt')}</p>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label
                    key={r.code}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      reasonCode === r.code
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-100 dark:border-gray-700 hover:border-green-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      className="accent-green-600"
                      checked={reasonCode === r.code}
                      onChange={() => setReasonCode(r.code)}
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {isFollowUpStep && currentFollowUp && (
            <div className="space-y-3">
              <p className="font-semibold text-gray-900 dark:text-white">{currentFollowUp.question}</p>
              {currentFollowUp.type === 'text' ? (
                <Textarea
                  placeholder={currentFollowUp.placeholder}
                  value={answers[currentFollowUp.id] || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [currentFollowUp.id]: e.target.value }))
                  }
                  rows={4}
                />
              ) : (
                <div className="space-y-2">
                  {currentFollowUp.options.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${
                        answers[currentFollowUp.id] === opt
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentFollowUp.id}
                        className="accent-green-600"
                        checked={answers[currentFollowUp.id] === opt}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [currentFollowUp.id]: opt }))
                        }
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-200">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {isConfirmStep && (
            <div className="space-y-4">
              <p className="font-semibold text-gray-900 dark:text-white">{t('action_review_title')}</p>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm space-y-2">
                <p>
                  <span className="text-gray-500">{t('action_reason_label')}:</span>{' '}
                  <strong>{reasonLabel}</strong>
                </p>
                {followUps.map((q) => (
                  <p key={q.id}>
                    <span className="text-gray-500">{q.question}</span>
                    <br />
                    <strong>{answers[q.id] || '—'}</strong>
                  </p>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('action_extra_comments')}
                </label>
                <Textarea
                  className="mt-2"
                  placeholder={t('action_comments_placeholder')}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                />
              </div>
              {actionType === 'return' && (
                <p className="text-xs text-gray-500 flex items-start gap-2">
                  <RotateCcw className="h-4 w-4 flex-shrink-0" />
                  {t('action_return_note')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t dark:border-gray-700 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={goBack} className="gap-1 rounded-xl" disabled={submitting}>
              <ChevronLeft className="h-4 w-4" />
              {t('back')}
            </Button>
          )}
          {!isConfirmStep ? (
            <Button onClick={goNext} className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl gap-1">
              {t('next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 rounded-xl text-white ${
                actionType === 'cancel'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : actionType === 'cancel' ? (
                t('action_confirm_cancel')
              ) : (
                t('action_confirm_return')
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
