import { useMemo, useState } from 'react';
import { Eraser } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { ComparisonCards } from './components/ComparisonCards';
import { ComparisonTable } from './components/ComparisonTable';
import { Header } from './components/Header';
import { PrintableReport } from './components/PrintableReport';
import { ResultsCharts } from './components/ResultsCharts';
import { ScenarioCalculator } from './components/ScenarioCalculator';
import { createEmptyScenario, exampleCurrentScenario, exampleProjectedScenario } from './data/exampleData';
import { FinancialScenario } from './types/financial';
import { buildComparisonRows, calculateScenario } from './utils/calculations';

interface AppState {
  current: FinancialScenario;
  projected: FinancialScenario;
}

type MobileTab = 'current' | 'projected' | 'comparison';

const emptyState = (): AppState => ({
  current: createEmptyScenario(),
  projected: createEmptyScenario(),
});

const exampleState = (): AppState => ({
  current: exampleCurrentScenario(),
  projected: exampleProjectedScenario(),
});

const initialState = () =>
  new URLSearchParams(window.location.search).has('example') ? exampleState() : emptyState();

function App() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>(initialState);
  const [presentationMode, setPresentationMode] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('current');
  const [confirmingClear, setConfirmingClear] = useState(false);

  const currentResults = useMemo(() => calculateScenario(state.current), [state.current]);
  const projectedResults = useMemo(() => calculateScenario(state.projected), [state.projected]);
  const comparisonRows = useMemo(() => buildComparisonRows(currentResults, projectedResults), [currentResults, projectedResults]);

  const setCurrent = (current: FinancialScenario) => setState((previous) => ({ ...previous, current }));
  const setProjected = (projected: FinancialScenario) => setState((previous) => ({ ...previous, projected }));

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      return;
    }

    await document.exitFullscreen?.();
  };

  const clearCalculator = () => {
    setState(emptyState());
    setConfirmingClear(false);
  };

  const logout = async () => {
    setState(emptyState());
    await signOut();
    navigate('/login', { replace: true });
  };

  const comparisonPanel = (
    <>
      <section className="content-section">
        <div className="section-heading">
          <span>Comparação final</span>
          <h2>Cenário Atual x Cenário Projetado</h2>
        </div>
        <ComparisonCards current={currentResults} projected={projectedResults} />
        <div className="mt-4">
          <ComparisonTable rows={comparisonRows} />
        </div>
      </section>

      <ResultsCharts current={currentResults} projected={projectedResults} />
    </>
  );

  return (
    <div className={presentationMode ? 'presentation-mode min-h-screen' : 'min-h-screen'}>
      <Header
        onExample={() => setState(exampleState())}
        onClear={() => setConfirmingClear(true)}
        onPrint={() => window.print()}
        onFullscreen={toggleFullscreen}
        presentationMode={presentationMode}
        onTogglePresentation={() => setPresentationMode((value) => !value)}
        userName={user?.name || ''}
        isAdmin={user?.role === 'admin'}
        onLogout={logout}
      />

      <PrintableReport current={currentResults} projected={projectedResults} rows={comparisonRows} />

      <main className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
        <div className="print-report-heading" aria-hidden="true">
          <div>
            <strong>Relatório comparativo de resultados</strong>
            <span>Cenário atual e projeção financeira</span>
          </div>
          <span>Emitido em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}</span>
        </div>

        <nav className="mobile-tabs" aria-label="Seções da calculadora">
          {[
            ['current', 'Atual'],
            ['projected', 'Projetado'],
            ['comparison', 'Comparação'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={activeTab === key ? 'mobile-tab mobile-tab-active' : 'mobile-tab'}
              onClick={() => setActiveTab(key as MobileTab)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="scenario-grid">
          <div className={activeTab === 'current' ? 'mobile-panel-active' : 'mobile-panel-hidden'}>
            <ScenarioCalculator
              title="Cenário Atual"
              scenario={state.current}
              results={currentResults}
              onChange={setCurrent}
              accent="current"
            />
          </div>
          <div className={activeTab === 'projected' ? 'mobile-panel-active' : 'mobile-panel-hidden'}>
            <ScenarioCalculator
              title="Cenário Projetado"
              scenario={state.projected}
              results={projectedResults}
              onChange={setProjected}
              accent="projected"
            />
          </div>
        </div>

        <div className={activeTab === 'comparison' ? 'mobile-panel-active comparison-stack' : 'mobile-panel-hidden comparison-stack'}>
          {comparisonPanel}
        </div>
      </main>

      {confirmingClear ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setConfirmingClear(false)}>
          <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="clear-title">
            <div className="confirm-icon confirm-icon-danger"><Eraser size={24} /></div>
            <h2 id="clear-title">Limpar calculadora</h2>
            <p>Deseja realmente limpar todos os valores da calculadora?</p>
            <div className="confirm-actions">
              <button type="button" onClick={() => setConfirmingClear(false)}>Cancelar</button>
              <button type="button" className="confirm-danger" onClick={clearCalculator}>Limpar valores</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
