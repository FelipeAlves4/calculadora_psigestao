import { Clock3, HeartHandshake, ReceiptText, TrendingUp, WalletCards } from 'lucide-react';
import { PsychologistResults } from '../types/psychologist';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export const PsychologistComparisonCards = ({ current, projected }: { current: PsychologistResults; projected: PsychologistResults }) => {
  const monthly = projected.monthlyProfit - current.monthlyProfit, annual = projected.annualProfit - current.annualProfit, revenue = projected.revenue - current.revenue, costs = projected.totalCosts - current.totalCosts, hours = projected.totalHours - current.totalHours, lives = projected.livesImpacted - current.livesImpacted;
  const growth = current.monthlyProfit === 0 ? null : (monthly / Math.abs(current.monthlyProfit)) * 100;
  const cards = [
    ['Aumento do resultado mensal', formatCurrency(monthly), monthly >= 0, TrendingUp], ['Aumento do resultado anual', formatCurrency(annual), annual >= 0, WalletCards], ['Diferença de faturamento', formatCurrency(revenue), revenue >= 0, ReceiptText],
    ['Diferença de custos', formatCurrency(costs), costs <= 0, ReceiptText], ['Horas trabalhadas', `${Math.abs(hours).toLocaleString('pt-BR')} horas ${hours < 0 ? 'a menos' : hours > 0 ? 'a mais' : ''}`, hours <= 0, Clock3], ['Aumento de vidas impactadas', lives.toLocaleString('pt-BR'), lives >= 0, HeartHandshake],
    ['Novo ganho por hora', `${formatCurrency(projected.hourlyGain)}/h`, projected.hourlyGain >= current.hourlyGain, TrendingUp], ['Crescimento do resultado', growth === null ? 'Sem base' : formatPercentage(growth), growth === null ? monthly >= 0 : growth >= 0, TrendingUp],
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, positive, Icon]) => <div className="metric-card" key={label}><div className={`metric-icon ${positive ? 'metric-icon-positive' : 'metric-icon-negative'}`}><Icon size={19} /></div><span>{label}</span><strong className={positive ? 'text-gold-500' : 'text-red-300'}>{value}</strong></div>)}</div>;
};
