import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight as ArrowDownRightIcon, ArrowUpRight as ArrowUpRightIcon, Equal as EqualIcon } from 'lucide-react';
import { PsychologistResults } from '../types/psychologist';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface FinancialChartDatum {
  name: string;
  Atual: number;
  Projetado: number;
}

type ProductivityMetric = 'hours' | 'lives' | 'hourlyGain';

const chartText = { fill: '#cbd5e1', fontSize: 11 };
const compactNumber = (value: number) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);

const FinancialTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: FinancialChartDatum }> }) => {
  const datum = payload?.[0]?.payload;
  if (!active || !datum) return null;

  const difference = datum.Projetado - datum.Atual;
  const variation = datum.Atual === 0 ? null : (difference / Math.abs(datum.Atual)) * 100;
  const differenceLabel = `${difference > 0 ? '+ ' : difference < 0 ? '− ' : ''}${formatCurrency(Math.abs(difference))}`;

  return <div className="chart-tooltip">
    <strong>{datum.name}</strong>
    <span className="chart-tooltip-row chart-tooltip-current"><i />Atual <b>{formatCurrency(datum.Atual)}</b></span>
    <span className="chart-tooltip-row chart-tooltip-projected"><i />Projetado <b>{formatCurrency(datum.Projetado)}</b></span>
    <span className="chart-tooltip-difference">Diferença <b>{differenceLabel}</b>{variation === null ? ' · Sem base percentual' : ` · ${formatPercentage(variation)}`}</span>
  </div>;
};

export const PsychologistResultsCharts = ({ current, projected }: { current: PsychologistResults; projected: PsychologistResults }) => {
  const revenueComposition: FinancialChartDatum[] = [
    ['Receita grupos', 'groupRevenue'],
    ['Receita individual', 'individualRevenue'],
    ['Renda fixa', 'fixedIncome'],
  ].map(([name, key]) => ({ name, Atual: current[key as keyof PsychologistResults] as number, Projetado: projected[key as keyof PsychologistResults] as number }));
  const financial: FinancialChartDatum[] = [
    { name: 'Faturamento', Atual: current.revenue, Projetado: projected.revenue },
    { name: 'Custos', Atual: current.totalCosts, Projetado: projected.totalCosts },
    { name: 'Resultado mensal', Atual: current.monthlyProfit, Projetado: projected.monthlyProfit },
  ];
  const productivity: Array<{ label: string; metric: ProductivityMetric; actual: number; projected: number }> = [
    { label: 'Horas trabalhadas', metric: 'hours', actual: current.totalHours, projected: projected.totalHours },
    { label: 'Vidas impactadas', metric: 'lives', actual: current.livesImpacted, projected: projected.livesImpacted },
    { label: 'Ganho por hora', metric: 'hourlyGain', actual: current.hourlyGain, projected: projected.hourlyGain },
  ];

  return <section className="content-section results-charts-section">
    <div className="section-heading"><span>Gráficos</span><h2>Leitura visual dos resultados</h2></div>
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartFrame title="Composição da receita"><FinancialChart data={revenueComposition} /></ChartFrame>
      <ChartFrame title="Resultado financeiro"><FinancialChart data={financial} /></ChartFrame>
      <ChartFrame title="Impacto e produtividade">
        <div className="grid gap-3 sm:grid-cols-3">{productivity.map((item) => <ProductivityCard key={item.metric} {...item} />)}</div>
      </ChartFrame>
    </div>
  </section>;
};

const FinancialChart = ({ data }: { data: FinancialChartDatum[] }) => <ResponsiveContainer width="100%" height={320}>
  <BarChart data={data}>
    <CartesianGrid stroke="rgba(203, 213, 225, 0.13)" strokeDasharray="3 3" vertical={false} />
    <XAxis dataKey="name" tick={chartText} interval={0} angle={-12} textAnchor="end" height={70} />
    <YAxis tickFormatter={compactNumber} tick={chartText} />
    <Tooltip content={<FinancialTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
    <Legend wrapperStyle={{ color: '#cbd5e1' }} />
    <Bar dataKey="Atual" fill="#9ca3af" radius={[4, 4, 0, 0]} />
    <Bar dataKey="Projetado" fill="#c99732" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>;

const ProductivityCard = ({ label, metric, actual, projected }: { label: string; metric: ProductivityMetric; actual: number; projected: number }) => {
  const difference = projected - actual;
  const lowerIsBetter = metric === 'hours';
  const positive = difference === 0 ? null : lowerIsBetter ? difference < 0 : difference > 0;
  const Icon = positive === true ? ArrowUpRightIcon : positive === false ? ArrowDownRightIcon : EqualIcon;
  const tone = positive === true ? 'productivity-trend-positive' : positive === false ? 'productivity-trend-negative' : 'productivity-trend-neutral';
  const value = (number: number) => metric === 'hourlyGain' ? `${formatCurrency(number)}/h` : metric === 'hours' ? `${formatNumber(number)} h/mês` : `${formatNumber(number)} pessoas`;
  const differenceText = () => {
    if (difference === 0) return 'Sem alteração';
    if (metric === 'hours') return `${formatNumber(Math.abs(difference))} h ${difference < 0 ? 'a menos' : 'a mais'}`;
    if (metric === 'lives') return `${difference > 0 ? '+' : '−'}${formatNumber(Math.abs(difference))} pessoas`;
    const variation = actual === 0 ? null : (difference / Math.abs(actual)) * 100;
    return `${difference > 0 ? '+' : '−'}${formatCurrency(Math.abs(difference))}/h${variation === null ? ' · Sem base' : ` · ${formatPercentage(variation)}`}`;
  };

  return <article className="productivity-card">
    <span>{label}</span>
    <strong>{value(actual)} <i>→</i> {value(projected)}</strong>
    <small className={tone}><Icon size={14} />{differenceText()}</small>
  </article>;
};

const ChartFrame = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="chart-frame"><h3>{title}</h3>{children}</div>;
