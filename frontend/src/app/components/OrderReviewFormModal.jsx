import { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Star, X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useLang } from '../context/language';
import { REVIEW_QUESTIONNAIRE } from '../constants/reviewQuestionnaire';
import { ReviewModalPortal } from './ReviewModalPortal';

function productImageUrl(image) {
  if (!image) return 'https://placehold.co/120x120?text=Product';
  return image.startsWith('http') ? image : `http://localhost:5000${image}`;
}

export function OrderReviewFormModal({
  isOpen,
  orderId,
  orderShortId,
  productId,
  productName,
  productImage,
  initialRating = 0,
  onClose,
  onSubmit,
}) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [writtenReview, setWrittenReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = REVIEW_QUESTIONNAIRE.length + 1;
  const isWrittenStep = step === REVIEW_QUESTIONNAIRE.length;
  const currentQuestion = !isWrittenStep ? REVIEW_QUESTIONNAIRE[step] : null;

  const surveyPreview = useMemo(
    () =>
      REVIEW_QUESTIONNAIRE.map((q) => ({
        question: t(q.questionKey),
        answer: answers[q.id]
          ? t(q.options.find((o) => o.value === answers[q.id])?.labelKey || '')
          : '',
      })),
    [answers, t]
  );

  if (!isOpen || !productId || !initialRating) return null;

  const reset = () => {
    setStep(0);
    setAnswers({});
    setWrittenReview('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validateStep = () => {
    if (isWrittenStep) {
      setError('');
      return true;
    }
    if (currentQuestion?.required && !answers[currentQuestion.id]) {
      setError(t('action_answer_required'));
      return false;
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
      const questionnaire = REVIEW_QUESTIONNAIRE.map((q) => ({
        question: t(q.questionKey),
        answer: t(q.options.find((o) => o.value === answers[q.id])?.labelKey || ''),
      }));
      await onSubmit({
        rating: initialRating,
        comment: writtenReview.trim(),
        orderId,
        productId,
        surveyAnswers: questionnaire,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err.message || t('review_submit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReviewModalPortal open={isOpen} onBackdropClose={submitting ? undefined : handleClose}>
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-2xl relative z-[20101] bg-white dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 text-white flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-600">
          <div>
            <p className="text-sm opacity-90">
              {t('review_order_delivered')} #{orderShortId}
            </p>
            <h2 className="text-xl font-bold">{t('review_form_title')}</h2>
          </div>
          <button type="button" onClick={handleClose} className="p-2 rounded-full hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-4 items-center border-b dark:border-gray-700 pb-4">
          <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
            <img
              src={productImageUrl(productImage)}
              alt={productName}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white truncate">{productName}</p>
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= initialRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400 ml-2">
                {t(`rating_label_${initialRating}`)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pt-3">
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

          {!isWrittenStep && currentQuestion && (
            <div className="space-y-3">
              <p className="font-semibold text-gray-900 dark:text-white">
                {t(currentQuestion.questionKey)}
              </p>
              <div className="space-y-2">
                {currentQuestion.options.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${
                      answers[currentQuestion.id] === opt.value
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      className="accent-green-600"
                      checked={answers[currentQuestion.id] === opt.value}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt.value }))
                      }
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">{t(opt.labelKey)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {isWrittenStep && (
            <div className="space-y-4">
              <p className="font-semibold text-gray-900 dark:text-white">{t('review_written_title')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('review_written_optional')}</p>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm space-y-2">
                {surveyPreview.map((row) => (
                  <p key={row.question}>
                    <span className="text-gray-500">{row.question}</span>
                    <br />
                    <strong>{row.answer || '—'}</strong>
                  </p>
                ))}
              </div>
              <Textarea
                placeholder={t('review_comment_placeholder')}
                value={writtenReview}
                onChange={(e) => setWrittenReview(e.target.value)}
                rows={4}
                className="bg-white dark:bg-gray-900"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t dark:border-gray-700 flex gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={goBack} className="gap-1 rounded-xl" disabled={submitting}>
              <ChevronLeft className="h-4 w-4" />
              {t('back')}
            </Button>
          )}
          {!isWrittenStep ? (
            <Button
              type="button"
              onClick={goNext}
              className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl gap-1 text-white"
            >
              {t('next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl text-white"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                t('review_submit')
              )}
            </Button>
          )}
        </div>
      </Card>
    </ReviewModalPortal>
  );
}
