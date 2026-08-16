import { BarChart3, CheckCircle2, TrendingUp } from 'lucide-react';
import { INDICATOR_CONFIG } from '../data/indicatorConfig';
import { ComparisonRow, ScenarioResults } from '../types/financial';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface PrintableReportProps {
  current: ScenarioResults;
  projected: ScenarioResults;
  rows: ComparisonRow[];
}

const formatRowValue = (row: ComparisonRow, value: number) =>
  row.format === 'percentage' ? formatPercentage(value) : formatCurrency(value);

const ReportFooter = ({ page }: { page: number }) => (
  <footer className="print-page-footer">
    <span>ASEX Educação · Calculadora de Resultados</span>
    <span>Página {page} de 2</span>
  </footer>
);

export const PrintableReport = ({ current, projected, rows }: PrintableReportProps) => {
  const monthlyGain = projected.monthlyProfit - current.monthlyProfit;
  const annualGain = projected.annualProfit - current.annualProfit;
  const revenueGrowth = current.revenue === 0 ? null : ((projected.revenue - current.revenue) / Math.abs(current.revenue)) * 100;
  const currentCostShare = current.revenue === 0 ? 0 : (current.totalCosts / current.revenue) * 100;
  const projectedCostShare = projected.revenue === 0 ? 0 : (projected.totalCosts / projected.revenue) * 100;
  const annualScale = Math.max(Math.abs(current.annualProfit), Math.abs(projected.annualProfit), 1);
  const issuedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());

  const highlights = [
    { label: 'Lucro mensal projetado', value: formatCurrency(projected.monthlyProfit), detail: `${formatCurrency(monthlyGain)} de impacto mensal` },
    { label: 'Lucro anual projetado', value: formatCurrency(projected.annualProfit), detail: `${formatCurrency(annualGain)} de impacto anual` },
    { label: 'Margem projetada', value: formatPercentage(projected.profitMargin), detail: `${formatPercentage(projected.profitMargin - current.profitMargin)} de variação` },
    {
      label: 'Custos sobre faturamento',
      value: formatPercentage(projectedCostShare),
      detail: `${formatPercentage(projectedCostShare - currentCostShare)} de variação`,
    },
  ];

  const resultRows = rows.filter((row) =>
    ['revenue', 'totalCosts', 'monthlyProfit', 'profitMargin', 'annualProfit'].includes(row.key),
  );

  return (
    <article className="print-report" aria-label="Relatório financeiro para impressão">
      <section className="print-page print-cover-page">
        <header className="print-report-header">
          <div className="print-report-brand">
            <span className="print-report-logo"><BarChart3 size={22} /></span>
            <div>
              <strong>ASEX Educação</strong>
              <span>Inteligência para resultados</span>
            </div>
          </div>
          <div className="print-report-meta">
            <span>Relatório executivo</span>
            <strong>{issuedAt}</strong>
          </div>
        </header>

        <div className="print-report-title">
          <span>Análise financeira comparativa</span>
          <h1>Cenário atual x cenário projetado</h1>
          <p>Visão consolidada do desempenho atual e do potencial de resultado após a aplicação das melhorias planejadas.</p>
        </div>

        <div className="print-highlight-grid">
          {highlights.map((item, index) => (
            <div key={item.label} className={index === 0 ? 'print-highlight-card print-highlight-featured' : 'print-highlight-card'}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </div>
          ))}
        </div>

        <div className="print-section-heading">
          <div>
            <span>Resumo executivo</span>
            <h2>Principais indicadores</h2>
          </div>
          <div className="print-growth-badge">
            <TrendingUp size={16} />
            {revenueGrowth === null ? 'Sem base para crescimento' : `${formatPercentage(revenueGrowth)} no faturamento`}
          </div>
        </div>

        <table className="print-report-table print-summary-table">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Cenário atual</th>
              <th>Cenário projetado</th>
              <th>Impacto</th>
              <th>Leitura</th>
            </tr>
          </thead>
          <tbody>
            {resultRows.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>{formatRowValue(row, row.current)}</td>
                <td className="print-projected-value">{formatRowValue(row, row.projected)}</td>
                <td className={row.status === 'positive' ? 'print-positive' : row.status === 'negative' ? 'print-negative' : ''}>
                  {formatRowValue(row, row.difference)}
                </td>
                <td>
                  <span className={`print-status print-status-${row.status}`}>
                    {row.status === 'positive' ? 'Melhoria' : row.status === 'negative' ? 'Atenção' : 'Estável'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ReportFooter page={1} />
      </section>

      <section className="print-page">
        <header className="print-report-header print-report-header-compact">
          <div className="print-report-brand">
            <span className="print-report-logo"><BarChart3 size={19} /></span>
            <div>
              <strong>Detalhamento da projeção</strong>
              <span>Premissas operacionais e impacto anual</span>
            </div>
          </div>
          <span className="print-confidential">Uso gerencial</span>
        </header>

        <div className="print-detail-grid">
          <div>
            <div className="print-section-heading print-section-heading-compact">
              <div>
                <span>Composição dos custos</span>
                <h2>Premissas por indicador</h2>
              </div>
            </div>
            <table className="print-report-table print-detail-table">
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Atual</th>
                  <th>Projetado</th>
                  <th>Diferença</th>
                </tr>
              </thead>
              <tbody>
                {INDICATOR_CONFIG.map((config) => {
                  const currentIndicator = current.indicators[config.key];
                  const projectedIndicator = projected.indicators[config.key];
                  const percentageDifference = projectedIndicator.percentage - currentIndicator.percentage;

                  return (
                    <tr key={config.key}>
                      <td>{config.label}</td>
                      <td>
                        <strong>{formatPercentage(currentIndicator.percentage)}</strong>
                        <small>{formatCurrency(currentIndicator.amount)}</small>
                      </td>
                      <td className="print-projected-value">
                        <strong>{formatPercentage(projectedIndicator.percentage)}</strong>
                        <small>{formatCurrency(projectedIndicator.amount)}</small>
                      </td>
                      <td className={percentageDifference <= 0 ? 'print-positive' : 'print-negative'}>
                        {formatPercentage(percentageDifference)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="print-insight-strip">
              <div>
                <span>Crescimento de receita</span>
                <strong>{revenueGrowth === null ? 'Sem base' : formatPercentage(revenueGrowth)}</strong>
              </div>
              <div>
                <span>Redução do CMV</span>
                <strong>{formatPercentage(current.indicators.cmv.percentage - projected.indicators.cmv.percentage)}</strong>
              </div>
              <div>
                <span>Expansão de margem</span>
                <strong>{formatPercentage(projected.profitMargin - current.profitMargin)}</strong>
              </div>
            </div>
          </div>

          <aside className="print-impact-panel">
            <span className="print-impact-eyebrow">Resultado anual</span>
            <h2>Evolução do lucro</h2>
            <p>Comparação direta do lucro acumulado em doze meses.</p>

            <div className="print-bar-chart">
              <div className="print-bar-row">
                <div><span>Atual</span><strong>{formatCurrency(current.annualProfit)}</strong></div>
                <div className="print-bar-track">
                  <span className="print-bar-current" style={{ width: `${(Math.abs(current.annualProfit) / annualScale) * 100}%` }} />
                </div>
              </div>
              <div className="print-bar-row">
                <div><span>Projetado</span><strong>{formatCurrency(projected.annualProfit)}</strong></div>
                <div className="print-bar-track">
                  <span className="print-bar-projected" style={{ width: `${(Math.abs(projected.annualProfit) / annualScale) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="print-impact-callout">
              <CheckCircle2 size={20} />
              <div>
                <span>Potencial adicional em 12 meses</span>
                <strong>{formatCurrency(annualGain)}</strong>
              </div>
            </div>

            <div className="print-report-note">
              <strong>Nota metodológica</strong>
              <p>Os valores apresentados são estimativas baseadas nas premissas informadas na calculadora. Resultados reais podem variar conforme execução, sazonalidade e condições do negócio.</p>
            </div>
          </aside>
        </div>

        <ReportFooter page={2} />
      </section>
    </article>
  );
};
