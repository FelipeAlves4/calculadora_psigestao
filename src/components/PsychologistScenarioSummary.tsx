import { PsychologistResults } from '../types/psychologist';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export const PsychologistScenarioSummary = ({ results }: { results: PsychologistResults }) => {
  const tone = results.monthlyProfit >= 0 ? 'text-gold-500' : 'text-red-300';
  const items = [
    ['Resultado mensal', formatCurrency(results.monthlyProfit), tone], ['Margem de resultado', formatPercentage(results.profitMargin), tone], ['Resultado anual', formatCurrency(results.annualProfit), tone],
    ['Faturamento mensal', formatCurrency(results.revenue), 'text-white'], ['Custos mensais', formatCurrency(results.totalCosts), 'text-white'], ['Horas trabalhadas', `${results.totalHours.toLocaleString('pt-BR')} h/mês`, 'text-white'],
    ['Vidas impactadas', `${results.livesImpacted.toLocaleString('pt-BR')} pessoas`, 'text-white'], ['Ganho por hora', `${formatCurrency(results.hourlyGain)}/h`, 'text-white'],
  ];
  return <div className="mt-5 grid gap-3"><div className="profit-card"><span className="profit-card-title">Resultado financeiro e impacto</span><div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map(([label, value, color], index) => <div className="summary-item rounded-md border border-white/10 bg-[#142944] p-3" key={label}><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span><strong className={`mt-1 block ${index < 3 ? 'text-xl' : 'text-base'} ${color}`}>{value}</strong></div>)}</div></div></div>;
};
