import { ScenarioResults } from '../types/financial';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface ScenarioSummaryProps {
  results: ScenarioResults;
}

export const ScenarioSummary = ({ results }: ScenarioSummaryProps) => {
  const profitTone = results.monthlyProfit >= 0 ? 'text-gold-500' : 'text-red-300';

  return (
    <div className="mt-5 grid gap-3">
      <div className="profit-card">
        <span className="profit-card-title">Resultado financeiro</span>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SummaryItem label="Lucro mensal" value={formatCurrency(results.monthlyProfit)} valueClassName={profitTone} featured />
          <SummaryItem label="Margem de lucro" value={formatPercentage(results.profitMargin)} valueClassName={profitTone} />
          <SummaryItem
            label="Lucro anual"
            value={formatCurrency(results.annualProfit)}
            valueClassName={results.annualProfit >= 0 ? 'text-gold-500' : 'text-red-300'}
            featured
          />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <SummaryItem label="Faturamento mensal" value={formatCurrency(results.revenue)} />
        <SummaryItem label="Total de custos mensais" value={formatCurrency(results.totalCosts)} />
      </div>
    </div>
  );
};

const SummaryItem = ({
  label,
  value,
  valueClassName = 'text-white',
  featured = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  featured?: boolean;
}) => (
  <div className="summary-item rounded-md border border-white/10 bg-[#142944] p-3">
    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    <strong className={`mt-1 block ${featured ? 'text-xl' : 'text-base'} ${valueClassName}`}>{value}</strong>
  </div>
);
