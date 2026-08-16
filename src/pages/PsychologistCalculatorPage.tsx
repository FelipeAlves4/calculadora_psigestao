import { useMemo, useState } from 'react';
import { Eraser } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Header } from '../components/Header';
import { PsychologistComparisonCards } from '../components/PsychologistComparisonCards';
import { PsychologistComparisonTable } from '../components/PsychologistComparisonTable';
import { PsychologistPrintableReport } from '../components/PsychologistPrintableReport';
import { PsychologistResultsCharts } from '../components/PsychologistResultsCharts';
import { PsychologistScenarioCalculator } from '../components/PsychologistScenarioCalculator';
import { createEmptyPsychologistScenario, exampleCurrentPsychologistScenario, exampleProjectedPsychologistScenario } from '../data/psychologistExampleData';
import { PsychologistScenario } from '../types/psychologist';
import { buildPsychologistComparisonRows, calculatePsychologistScenario, projectionSummary } from '../utils/psychologistCalculations';

type Tab = 'current' | 'projected' | 'comparison';
const emptyState = () => ({ current: createEmptyPsychologistScenario(), projected: createEmptyPsychologistScenario() });
const exampleState = () => ({ current: exampleCurrentPsychologistScenario(), projected: exampleProjectedPsychologistScenario() });

export const PsychologistCalculatorPage = () => {
  const { user, signOut } = useAuth(); const navigate = useNavigate();
  const [state, setState] = useState(() => new URLSearchParams(window.location.search).has('example') ? exampleState() : emptyState());
  const [presentationMode, setPresentationMode] = useState(false); const [tab, setTab] = useState<Tab>('current'); const [confirmingClear, setConfirmingClear] = useState(false);
  const current = useMemo(() => calculatePsychologistScenario(state.current), [state.current]);
  const projected = useMemo(() => calculatePsychologistScenario(state.projected), [state.projected]);
  const rows = useMemo(() => buildPsychologistComparisonRows(current, projected), [current, projected]);
  const change = (key: 'current' | 'projected') => (value: PsychologistScenario) => setState((previous) => ({ ...previous, [key]: value }));
  const fullscreen = async () => { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); };
  const logout = async () => { setState(emptyState()); await signOut(); navigate('/login', { replace: true }); };
  const comparison = <><section className="content-section"><div className="section-heading"><span>Comparação final</span><h2>Cenário Atual x Cenário Projetado</h2><p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-300">{projectionSummary(current, projected)}</p></div><PsychologistComparisonCards current={current} projected={projected} /><div className="mt-4"><PsychologistComparisonTable rows={rows} /></div></section><PsychologistResultsCharts current={current} projected={projected} /></>;
  return <div className={presentationMode ? 'presentation-mode min-h-screen' : 'min-h-screen'}><Header title="Calculadora de Resultados para Psicólogos" subtitle="Compare seu cenário atual com uma projeção de atendimento mais rentável, eficiente e escalável." onExample={() => setState(exampleState())} onClear={() => setConfirmingClear(true)} onPrint={() => window.print()} onFullscreen={fullscreen} presentationMode={presentationMode} onTogglePresentation={() => setPresentationMode((value) => !value)} userName={user?.name || ''} isAdmin={user?.role === 'admin'} onLogout={logout} /><PsychologistPrintableReport current={current} projected={projected} rows={rows} /><main className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8"><div className="print-report-heading" aria-hidden="true"><div><strong>Calculadora de Resultados para Psicólogos</strong><span>Cenário atual e projeção de atendimentos</span></div><span>Emitido em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}</span></div><nav className="mobile-tabs" aria-label="Seções da calculadora">{([['current', 'Atual'], ['projected', 'Projetado'], ['comparison', 'Comparação']] as const).map(([key, label]) => <button key={key} type="button" className={tab === key ? 'mobile-tab mobile-tab-active' : 'mobile-tab'} onClick={() => setTab(key)}>{label}</button>)}</nav><div className="scenario-grid"><div className={tab === 'current' ? 'mobile-panel-active' : 'mobile-panel-hidden'}><PsychologistScenarioCalculator title="Cenário Atual" scenario={state.current} results={current} onChange={change('current')} accent="current" /></div><div className={tab === 'projected' ? 'mobile-panel-active' : 'mobile-panel-hidden'}><PsychologistScenarioCalculator title="Cenário Projetado" scenario={state.projected} results={projected} onChange={change('projected')} accent="projected" /></div></div><div className={tab === 'comparison' ? 'mobile-panel-active comparison-stack' : 'mobile-panel-hidden comparison-stack'}>{comparison}</div></main>{confirmingClear && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setConfirmingClear(false)}><div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="clear-title"><div className="confirm-icon confirm-icon-danger"><Eraser size={24} /></div><h2 id="clear-title">Limpar calculadora</h2><p>Deseja realmente limpar todos os valores da calculadora?</p><div className="confirm-actions"><button type="button" onClick={() => setConfirmingClear(false)}>Cancelar</button><button type="button" className="confirm-danger" onClick={() => { setState(emptyState()); setConfirmingClear(false); }}>Limpar valores</button></div></div></div>}</div>;
};
