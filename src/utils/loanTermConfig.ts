export type RepaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface TermConfig {
  unit: string;
  unitLabel: string;
  unitLabelPlural: string;
  min: number;
  max: number;
  default: number;
  presets: number[];
  interestRateHint: string;
  collectionHint: string;
}

export const TERM_CONFIG: Record<RepaymentFrequency, TermConfig> = {
  daily: {
    unit: 'days',
    unitLabel: 'day',
    unitLabelPlural: 'days',
    min: 1,
    max: 180,
    default: 90,
    presets: [30, 60, 90, 120, 180],
    interestRateHint: 'Interest % per day on gross amount',
    collectionHint: 'Credit today → collect from tomorrow, then every day',
  },
  weekly: {
    unit: 'weeks',
    unitLabel: 'week',
    unitLabelPlural: 'weeks',
    min: 1,
    max: 104,
    default: 12,
    presets: [4, 8, 12, 26, 52],
    interestRateHint: 'Interest % per week on gross amount',
    collectionHint: 'Credit 1 May → first collection 8 May, then weekly',
  },
  biweekly: {
    unit: 'periods',
    unitLabel: '14-day period',
    unitLabelPlural: '14-day periods',
    min: 1,
    max: 52,
    default: 6,
    presets: [2, 4, 6, 12, 26],
    interestRateHint: 'Interest % per 14-day period on gross amount',
    collectionHint: 'Credit 1 May → first collection 15 May, then every 14 days',
  },
  monthly: {
    unit: 'months',
    unitLabel: 'month',
    unitLabelPlural: 'months',
    min: 1,
    max: 120,
    default: 12,
    presets: [3, 6, 12, 24, 36, 60],
    interestRateHint: 'Interest % per month on gross amount',
    collectionHint: 'Credit 1 May → first collection 1 June, then monthly',
  },
};

export function getTermConfig(frequency: RepaymentFrequency): TermConfig {
  return TERM_CONFIG[frequency];
}
