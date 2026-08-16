import { INDICATOR_CONFIG } from '../data/indicatorConfig';
import { SIMULATION_RULES } from '../data/simulationRules';
import {
  ComparisonKey,
  ComparisonRow,
  FinancialScenario,
  IndicatorKey,
  LinkedValue,
  ScenarioResults,
} from '../types/financial';
import { clamp, toFiniteNumber } from './formatters';

export const roundMoney = (value: number) => Number(toFiniteNumber(value).toFixed(2));
export const roundPercentage = (value: number) => Number(toFiniteNumber(value).toFixed(4));

export const amountFromPercentage = (revenue: number, percentage: number) =>
  roundMoney((toFiniteNumber(revenue) * toFiniteNumber(percentage)) / 100);

export const percentageFromAmount = (revenue: number, amount: number) => {
  const safeRevenue = toFiniteNumber(revenue);
  if (safeRevenue === 0) {
    return 0;
  }

  return roundPercentage((toFiniteNumber(amount) / safeRevenue) * 100);
};

export const sanitizeLinkedValue = (value: LinkedValue, revenue: number, max = 100): LinkedValue => {
  const percentage = clamp(value.percentage, 0, max);
  const amount = roundMoney(value.amount);
  return {
    amount,
    percentage: revenue === 0 ? 0 : percentage,
  };
};

export const calculateScenario = (scenario: FinancialScenario): ScenarioResults => {
  const revenue = roundMoney(scenario.revenue);
  const indicators = { ...scenario.indicators };
  const totalCosts = roundMoney(Object.values(indicators).reduce((sum, item) => sum + toFiniteNumber(item.amount), 0));
  const monthlyProfit = roundMoney(revenue - totalCosts);
  const profitMargin = revenue === 0 ? 0 : roundPercentage((monthlyProfit / revenue) * 100);

  return {
    revenue,
    totalCosts,
    monthlyProfit,
    profitMargin,
    annualProfit: roundMoney(monthlyProfit * 12),
    indicators,
  };
};

const isPositiveWhenHigher = (key: ComparisonKey) =>
  key === 'revenue' || key === 'monthlyProfit' || key === 'profitMargin' || key === 'annualProfit';

const getStatus = (key: ComparisonKey, difference: number): ComparisonRow['status'] => {
  if (Math.abs(difference) < 0.0001) {
    return 'neutral';
  }

  return isPositiveWhenHigher(key) === difference > 0 ? 'positive' : 'negative';
};

const variationFrom = (current: number, projected: number) => {
  if (current === 0) {
    return projected === 0 ? 0 : null;
  }

  return roundPercentage(((projected - current) / Math.abs(current)) * 100);
};

export const buildComparisonRows = (current: ScenarioResults, projected: ScenarioResults): ComparisonRow[] => {
  const indicatorRows: ComparisonRow[] = INDICATOR_CONFIG.map((config) => {
    const currentAmount = current.indicators[config.key].amount;
    const projectedAmount = projected.indicators[config.key].amount;
    const difference = roundMoney(projectedAmount - currentAmount);

    return {
      key: config.key,
      label: config.label,
      current: currentAmount,
      projected: projectedAmount,
      difference,
      variation: variationFrom(currentAmount, projectedAmount),
      format: 'currency',
      status: getStatus(config.key, difference),
    };
  });

  const resultRows: Array<{ key: ComparisonKey; label: string; current: number; projected: number; format: 'currency' | 'percentage' }> = [
    { key: 'revenue', label: 'Faturamento', current: current.revenue, projected: projected.revenue, format: 'currency' },
    { key: 'totalCosts', label: 'Custos totais', current: current.totalCosts, projected: projected.totalCosts, format: 'currency' },
    {
      key: 'monthlyProfit',
      label: 'Lucro mensal',
      current: current.monthlyProfit,
      projected: projected.monthlyProfit,
      format: 'currency',
    },
    {
      key: 'profitMargin',
      label: 'Margem de lucro',
      current: current.profitMargin,
      projected: projected.profitMargin,
      format: 'percentage',
    },
    {
      key: 'annualProfit',
      label: 'Lucro anual',
      current: current.annualProfit,
      projected: projected.annualProfit,
      format: 'currency',
    },
  ];

  return [
    resultRows[0],
    ...indicatorRows,
    ...resultRows.slice(1),
  ].map((row) => {
    const difference = row.format === 'percentage' ? roundPercentage(row.projected - row.current) : roundMoney(row.projected - row.current);
    return {
      ...row,
      difference,
      variation: variationFrom(row.current, row.projected),
      status: getStatus(row.key, difference),
    };
  });
};

export const distributeExpensesToTotal = (scenario: FinancialScenario, total: number): FinancialScenario => {
  const currentTotal = scenario.expenses.reduce((sum, item) => sum + toFiniteNumber(item.amount), 0);

  if (scenario.expenses.length === 0) {
    return scenario;
  }

  const expenses = scenario.expenses.map((item, index) => {
    const amount =
      currentTotal === 0
        ? total / scenario.expenses.length
        : (toFiniteNumber(item.amount) / currentTotal) * total;
    const isLast = index === scenario.expenses.length - 1;
    const previous = scenario.expenses
      .slice(0, index)
      .reduce((sum, previousItem) => {
        const previousAmount =
          currentTotal === 0
            ? total / scenario.expenses.length
            : (toFiniteNumber(previousItem.amount) / currentTotal) * total;
        return sum + roundMoney(previousAmount);
      }, 0);

    return {
      ...item,
      amount: isLast ? roundMoney(total - previous) : roundMoney(amount),
    };
  });

  return {
    ...scenario,
    expenses,
  };
};

export const withRevenueRecalculated = (scenario: FinancialScenario, revenue: number): FinancialScenario => {
  const safeRevenue = Math.max(0, roundMoney(revenue));
  return {
    ...scenario,
    revenue: safeRevenue,
    indicators: Object.fromEntries(
      Object.entries(scenario.indicators).map(([key, value]) => [
        key,
        {
          percentage: safeRevenue === 0 ? 0 : roundPercentage((value.amount / safeRevenue) * 100),
          amount: roundMoney(value.amount),
        },
      ]),
    ) as FinancialScenario['indicators'],
  };
};

export const updateIndicatorByAmount = (
  scenario: FinancialScenario,
  key: IndicatorKey,
  amount: number,
  maxPercentage = 100,
): FinancialScenario => {
  const safeAmount = Math.max(0, roundMoney(amount));
  const percentage = clamp(percentageFromAmount(scenario.revenue, safeAmount), 0, maxPercentage);
  const next = {
    ...scenario,
    indicators: {
      ...scenario.indicators,
      [key]: {
        amount: safeAmount,
        percentage,
      },
    },
  };

  return key === 'operationalExpenses' ? distributeExpensesToTotal(next, safeAmount) : next;
};

export const updateIndicatorByPercentage = (
  scenario: FinancialScenario,
  key: IndicatorKey,
  percentage: number,
  maxPercentage: number,
): FinancialScenario => {
  const safePercentage = clamp(percentage, 0, maxPercentage);
  const amount = amountFromPercentage(scenario.revenue, safePercentage);
  const next = {
    ...scenario,
    indicators: {
      ...scenario.indicators,
      [key]: {
        amount,
        percentage: scenario.revenue === 0 ? 0 : safePercentage,
      },
    },
  };

  return key === 'operationalExpenses' ? distributeExpensesToTotal(next, amount) : next;
};

export const updateOperationalExpensesFromItems = (scenario: FinancialScenario): FinancialScenario => {
  const amount = roundMoney(scenario.expenses.reduce((sum, item) => sum + toFiniteNumber(item.amount), 0));
  return {
    ...scenario,
    indicators: {
      ...scenario.indicators,
      operationalExpenses: {
        amount,
        percentage: percentageFromAmount(scenario.revenue, amount),
      },
    },
  };
};

export const applyImprovementSimulation = (current: FinancialScenario): FinancialScenario => {
  let next = withRevenueRecalculated(current, current.revenue * (1 + SIMULATION_RULES.revenueGrowthRate));

  next = updateIndicatorByPercentage(
    next,
    'cmv',
    next.indicators.cmv.percentage - SIMULATION_RULES.cmvReductionPoints,
    50,
  );
  next = updateIndicatorByAmount(next, 'waste', next.indicators.waste.amount * (1 - SIMULATION_RULES.wasteReductionRate), 20);
  next = updateIndicatorByAmount(
    next,
    'turnover',
    next.indicators.turnover.amount * (1 - SIMULATION_RULES.turnoverReductionRate),
    20,
  );
  next = updateIndicatorByAmount(
    next,
    'operationalExpenses',
    next.indicators.operationalExpenses.amount * (1 - SIMULATION_RULES.operationalExpensesReductionRate),
    50,
  );

  return next;
};

export const getMetricValue = (results: ScenarioResults, key: ComparisonKey) => {
  if (key in results.indicators) {
    return results.indicators[key as IndicatorKey].amount;
  }

  return results[key as keyof Omit<ScenarioResults, 'indicators'>] as number;
};
