import { PsychologistResults, PsychologistScenario } from '../types/psychologist';
import { NumericInput } from './FinancialInput';
import { PsychologistScenarioSummary } from './PsychologistScenarioSummary';

interface Props { title: string; scenario: PsychologistScenario; results: PsychologistResults; accent: 'current' | 'projected'; onChange: (scenario: PsychologistScenario) => void; }
const numberFields = new Set(['groupCount', 'peoplePerGroup', 'groupMeetings', 'individualPatients', 'individualSessions']);

export const PsychologistScenarioCalculator = ({ title, scenario, results, accent, onChange }: Props) => {
  const update = (field: keyof Omit<PsychologistScenario, 'expenses'>, value: number) => onChange({ ...scenario, [field]: numberFields.has(field) ? Math.round(value) : value });
  const expense = (field: keyof PsychologistScenario['expenses'], value: number) => onChange({ ...scenario, expenses: { ...scenario.expenses, [field]: value } });
  const description = accent === 'current' ? 'Como funciona hoje a sua operação de atendimentos.' : 'Simule uma nova estrutura de atendimentos e veja o impacto nos seus resultados.';
  return <section className={`scenario-panel scenario-panel-${accent}`}>
    <div className="scenario-title-row"><div><span className="text-xs font-bold uppercase tracking-[0.22em] text-gold-500">Atendimentos psicológicos</span><h2 className="mt-1 text-2xl font-extrabold uppercase text-white">{title}</h2><p className="mt-1 text-sm text-slate-300">{description}</p></div></div>
    <InputGroup title="Atendimentos em grupo">
      <Field label="Quantidade de grupos"><NumericInput value={scenario.groupCount} onChange={(value) => update('groupCount', value)} ariaLabel="Quantidade de grupos" compact /></Field>
      <Field label="Pessoas por grupo"><NumericInput value={scenario.peoplePerGroup} onChange={(value) => update('peoplePerGroup', value)} ariaLabel="Pessoas por grupo" compact /></Field>
      <Field label="Valor por pessoa"><NumericInput value={scenario.groupPrice} prefix="R$" onChange={(value) => update('groupPrice', value)} ariaLabel="Valor por pessoa no grupo" compact /></Field>
      <Field label="Encontros por mês"><NumericInput value={scenario.groupMeetings} onChange={(value) => update('groupMeetings', value)} ariaLabel="Encontros de grupo por mês" compact /></Field>
      <Field label="Duração média"><NumericInput value={scenario.groupDuration} suffix="h" onChange={(value) => update('groupDuration', value)} ariaLabel="Duração média de cada encontro" compact /></Field>
    </InputGroup>
    <InputGroup title="Atendimentos individuais">
      <Field label="Valor da sessão"><NumericInput value={scenario.individualPrice} prefix="R$" onChange={(value) => update('individualPrice', value)} ariaLabel="Valor da sessão individual" compact /></Field>
      <Field label="Pacientes individuais"><NumericInput value={scenario.individualPatients} onChange={(value) => update('individualPatients', value)} ariaLabel="Quantidade de pacientes individuais" compact /></Field>
      <Field label="Sessões por paciente"><NumericInput value={scenario.individualSessions} onChange={(value) => update('individualSessions', value)} ariaLabel="Sessões por paciente no mês" compact /></Field>
      <Field label="Duração média"><NumericInput value={scenario.individualDuration} suffix="h" onChange={(value) => update('individualDuration', value)} ariaLabel="Duração média da sessão individual" compact /></Field>
    </InputGroup>
    <InputGroup title="Outras receitas"><Field label="Salário fixo / renda adicional"><NumericInput value={scenario.fixedIncome} prefix="R$" onChange={(value) => update('fixedIncome', value)} ariaLabel="Salário fixo ou renda adicional" compact /></Field></InputGroup>
    <InputGroup title="Despesas"><Field label="Aluguel da sala"><NumericInput value={scenario.expenses.rent} prefix="R$" onChange={(value) => expense('rent', value)} ariaLabel="Aluguel da sala" compact /></Field><Field label="Combustível / locomoção"><NumericInput value={scenario.expenses.transport} prefix="R$" onChange={(value) => expense('transport', value)} ariaLabel="Combustível ou locomoção" compact /></Field><Field label="Alimentação"><NumericInput value={scenario.expenses.food} prefix="R$" onChange={(value) => expense('food', value)} ariaLabel="Alimentação" compact /></Field><Field label="Taxas e impostos"><NumericInput value={scenario.expenses.taxes} prefix="R$" onChange={(value) => expense('taxes', value)} ariaLabel="Taxas e impostos" compact /></Field><Field label="Outras despesas"><NumericInput value={scenario.expenses.other} prefix="R$" onChange={(value) => expense('other', value)} ariaLabel="Outras despesas" compact /></Field></InputGroup>
    <PsychologistScenarioSummary results={results} />
  </section>;
};

const InputGroup = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="indicator-card mb-4"><h3 className="mb-3 text-sm font-bold text-white">{title}</h3><div className="grid gap-3 sm:grid-cols-2">{children}</div></div>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="grid gap-1.5"><span className="text-xs font-semibold text-slate-300">{label}</span>{children}</label>;
