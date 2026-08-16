import { FinancialScenario, IndicatorKey } from '../types/financial';

const defaultExpenseNames = [
  'Aluguel',
  'Água',
  'Energia elétrica',
  'Gás',
  'Internet e telefone',
  'Sistemas e softwares',
  'Manutenção',
  'Marketing',
  'Contabilidade',
  'Outras despesas',
];

const expenseWeights = [0.32, 0.04, 0.12, 0.09, 0.04, 0.06, 0.07, 0.1, 0.05, 0.11];

export const createExpenses = (total: number) =>
  defaultExpenseNames.map((name, index) => ({
    id: `${name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    name,
    amount: Number((total * expenseWeights[index]).toFixed(2)),
  }));

const createIndicators = (revenue: number, percentages: Record<IndicatorKey, number>) =>
  Object.fromEntries(
    Object.entries(percentages).map(([key, percentage]) => [
      key,
      {
        amount: Number(((revenue * percentage) / 100).toFixed(2)),
        percentage,
      },
    ]),
  ) as FinancialScenario['indicators'];

export const createEmptyScenario = (): FinancialScenario => ({
  revenue: 0,
  indicators: createIndicators(0, {
    cmv: 0,
    waste: 0,
    turnover: 0,
    payroll: 0,
    operationalExpenses: 0,
    taxes: 0,
  }),
  expenses: createExpenses(0),
});

export const exampleCurrentScenario = (): FinancialScenario => {
  const revenue = 100000;
  const indicators = createIndicators(revenue, {
    cmv: 45,
    waste: 5,
    turnover: 3,
    payroll: 15,
    operationalExpenses: 15,
    taxes: 8,
  });

  return {
    revenue,
    indicators,
    expenses: createExpenses(indicators.operationalExpenses.amount),
  };
};

export const exampleProjectedScenario = (): FinancialScenario => {
  const revenue = 150000;
  const indicators = createIndicators(revenue, {
    cmv: 29,
    waste: 3,
    turnover: 2,
    payroll: 12,
    operationalExpenses: 13,
    taxes: 6.5,
  });

  return {
    revenue,
    indicators,
    expenses: createExpenses(indicators.operationalExpenses.amount),
  };
};
