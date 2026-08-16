export interface PsychologistExpenses {
  rent: number;
  transport: number;
  food: number;
  taxes: number;
  other: number;
}

export interface PsychologistScenario {
  groupCount: number;
  peoplePerGroup: number;
  groupPrice: number;
  groupMeetings: number;
  groupDuration: number;
  individualPrice: number;
  individualPatients: number;
  individualSessions: number;
  individualDuration: number;
  fixedIncome: number;
  expenses: PsychologistExpenses;
}

export interface PsychologistResults {
  groupRevenue: number;
  individualRevenue: number;
  fixedIncome: number;
  revenue: number;
  totalCosts: number;
  monthlyProfit: number;
  annualProfit: number;
  groupHours: number;
  individualHours: number;
  totalHours: number;
  groupLives: number;
  individualLives: number;
  livesImpacted: number;
  hourlyGain: number;
  profitMargin: number;
}

export type PsychologistMetricFormat = 'currency' | 'percentage' | 'hours' | 'number';

export interface PsychologistComparisonRow {
  key: string;
  label: string;
  current: number;
  projected: number;
  difference: number;
  variation: number | null;
  format: PsychologistMetricFormat;
  status: 'positive' | 'negative' | 'neutral';
}
