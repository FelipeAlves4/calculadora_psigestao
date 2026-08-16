export type IndicatorKey =
  | 'cmv'
  | 'waste'
  | 'turnover'
  | 'payroll'
  | 'operationalExpenses'
  | 'taxes';

export type ComparisonKey = IndicatorKey | 'revenue' | 'totalCosts' | 'monthlyProfit' | 'profitMargin' | 'annualProfit';

export interface LinkedValue {
  amount: number;
  percentage: number;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  custom?: boolean;
}

export interface FinancialScenario {
  revenue: number;
  indicators: Record<IndicatorKey, LinkedValue>;
  expenses: ExpenseItem[];
}

export interface ScenarioResults {
  revenue: number;
  totalCosts: number;
  monthlyProfit: number;
  profitMargin: number;
  annualProfit: number;
  indicators: Record<IndicatorKey, LinkedValue>;
}

export interface IndicatorConfig {
  key: IndicatorKey;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  positiveWhenLower: boolean;
}

export interface ComparisonRow {
  key: ComparisonKey;
  label: string;
  current: number;
  projected: number;
  difference: number;
  variation: number | null;
  format: 'currency' | 'percentage';
  status: 'positive' | 'negative' | 'neutral';
}
