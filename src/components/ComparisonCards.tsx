import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Percent, TrendingUp, WalletCards } from 'lucide-react';
import { ScenarioResults } from '../types/financial';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface ComparisonCardsProps {
  current: ScenarioResults;
  projected: ScenarioResults;
}

export const ComparisonCards = ({ current, projected }: ComparisonCardsProps) => {
  const monthlyProfitIncrease = projected.monthlyProfit - current.monthlyProfit;
  const annualProfitIncrease = projected.annualProfit - current.annualProfit;
  const costReduction = current.totalCosts - projected.totalCosts;
  const growth =
    current.monthlyProfit === 0
      ? null
      : ((projected.monthlyProfit - current.monthlyProfit) / Math.abs(current.monthlyProfit)) * 100;

  const cards = [
    {
      label: 'Aumento do lucro mensal',
      value: formatCurrency(monthlyProfitIncrease),
      positive: monthlyProfitIncrease >= 0,
      icon: TrendingUp,
    },
    {
      label: 'Aumento do lucro anual',
      value: formatCurrency(annualProfitIncrease),
      positive: annualProfitIncrease >= 0,
      icon: CircleDollarSign,
    },
    {
      label: 'Redução de custos',
      value: formatCurrency(costReduction),
      positive: costReduction >= 0,
      icon: ArrowDownRight,
    },
    {
      label: 'Nova margem de lucro',
      value: formatPercentage(projected.profitMargin),
      positive: projected.profitMargin >= current.profitMargin,
      icon: Percent,
    },
    {
      label: 'Retorno adicional anual',
      value: formatCurrency(annualProfitIncrease),
      positive: annualProfitIncrease >= 0,
      icon: WalletCards,
    },
    {
      label: 'Crescimento do lucro',
      value: growth === null ? 'Sem base' : formatPercentage(growth),
      positive: growth === null ? projected.monthlyProfit > current.monthlyProfit : growth >= 0,
      icon: ArrowUpRight,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="metric-card">
            <div className={`metric-icon ${card.positive ? 'metric-icon-positive' : 'metric-icon-negative'}`}>
              <Icon size={19} />
            </div>
            <span>{card.label}</span>
            <strong className={card.positive ? 'text-gold-500' : 'text-red-300'}>{card.value}</strong>
          </div>
        );
      })}
    </div>
  );
};
