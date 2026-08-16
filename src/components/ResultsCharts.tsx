import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { INDICATOR_CONFIG } from '../data/indicatorConfig';
import { ScenarioResults } from '../types/financial';
import { formatCurrency } from '../utils/formatters';

interface ResultsChartsProps {
  current: ScenarioResults;
  projected: ScenarioResults;
}

const currencyTick = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);

const tooltipFormatter = (
  value: number | string,
  name: number | string,
  item: { payload?: { name?: string } },
) => {
  const isProjected = name === 'Projetado' || item.payload?.name === 'Projetado';
  const color = isProjected ? '#c99732' : '#c7cdd6';
  const label = name === 'value' ? 'Lucro anual' : name;

  return [
    <span style={{ color, fontWeight: 700 }}>{formatCurrency(Number(value))}</span>,
    <span style={{ color, fontWeight: 700 }}>{label}</span>,
  ];
};

const chartText = { fill: '#cbd5e1', fontSize: 11 };
const tooltipStyle = {
  background: '#0b1b2d',
  border: '1px solid rgba(201, 151, 50, 0.35)',
  borderRadius: 6,
  color: '#ffffff',
};
const tooltipItemStyle = { color: '#f8fafc', fontWeight: 700 };
const tooltipLabelStyle = { color: '#cbd5e1', fontWeight: 600 };

export const ResultsCharts = ({ current, projected }: ResultsChartsProps) => {
  const costComposition = INDICATOR_CONFIG.map((config) => ({
    name: config.label,
    Atual: current.indicators[config.key].amount,
    Projetado: projected.indicators[config.key].amount,
  }));

  const financialResult = [
    { name: 'Faturamento', Atual: current.revenue, Projetado: projected.revenue },
    { name: 'Custos totais', Atual: current.totalCosts, Projetado: projected.totalCosts },
    { name: 'Lucro mensal', Atual: current.monthlyProfit, Projetado: projected.monthlyProfit },
  ];

  const annualProfit = [
    { name: 'Atual', value: current.annualProfit, fill: '#9ca3af' },
    { name: 'Projetado', value: projected.annualProfit, fill: '#c99732' },
  ];

  return (
    <section className="content-section results-charts-section">
      <div className="section-heading">
        <span>Gráficos</span>
        <h2>Leitura visual dos resultados</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartFrame title="Composição dos custos">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={costComposition}>
              <CartesianGrid stroke="rgba(203, 213, 225, 0.13)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={chartText} interval={0} angle={-18} textAnchor="end" height={88} />
              <YAxis tickFormatter={currencyTick} tick={chartText} />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Bar dataKey="Atual" fill="#9ca3af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Projetado" fill="#c99732" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Resultado financeiro">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={financialResult}>
              <CartesianGrid stroke="rgba(203, 213, 225, 0.13)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={chartText} />
              <YAxis tickFormatter={currencyTick} tick={chartText} />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Bar dataKey="Atual" fill="#9ca3af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Projetado" fill="#c99732" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Lucro anual">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={annualProfit}>
              <CartesianGrid stroke="rgba(203, 213, 225, 0.13)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={chartText} />
              <YAxis tickFormatter={currencyTick} tick={chartText} />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelStyle={tooltipLabelStyle}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {annualProfit.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </section>
  );
};

const ChartFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="chart-frame">
    <h3>{title}</h3>
    {children}
  </div>
);
