/** Three follow-up questions shown after the customer picks a star rating. */
export const REVIEW_QUESTIONNAIRE = [
  {
    id: 'freshness',
    questionKey: 'review_q_freshness',
    type: 'options',
    options: [
      { value: 'very_fresh', labelKey: 'review_a_very_fresh' },
      { value: 'fresh', labelKey: 'review_a_fresh' },
      { value: 'average', labelKey: 'review_a_average' },
      { value: 'not_fresh', labelKey: 'review_a_not_fresh' },
    ],
    required: true,
  },
  {
    id: 'quality',
    questionKey: 'review_q_quality',
    type: 'options',
    options: [
      { value: 'excellent', labelKey: 'review_a_excellent' },
      { value: 'good', labelKey: 'review_a_good' },
      { value: 'fair', labelKey: 'review_a_fair' },
      { value: 'poor', labelKey: 'review_a_poor' },
    ],
    required: true,
  },
  {
    id: 'packaging',
    questionKey: 'review_q_packaging',
    type: 'options',
    options: [
      { value: 'excellent', labelKey: 'review_a_packaging_excellent' },
      { value: 'good', labelKey: 'review_a_packaging_good' },
      { value: 'damaged', labelKey: 'review_a_packaging_damaged' },
      { value: 'poor', labelKey: 'review_a_packaging_poor' },
    ],
    required: true,
  },
];
