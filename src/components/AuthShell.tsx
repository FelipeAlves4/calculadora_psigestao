import { ChartNoAxesCombined, Clock3, Heart, LockKeyhole, TrendingUp, WalletCards, type LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

type AuthVariant = 'login' | 'register';

const panelContent: Record<AuthVariant, { title: string; description: string; benefits: Array<{ icon: LucideIcon; label: string }> }> = {
  login: {
    title: 'Calculadora de Resultados para Psicólogos',
    description: 'Compare seu cenário atual com uma projeção de crescimento e veja o impacto nos seus resultados.',
    benefits: [
      { icon: ChartNoAxesCombined, label: 'Compare cenário atual e projetado' },
      { icon: WalletCards, label: 'Veja faturamento, custos e resultado' },
      { icon: Clock3, label: 'Analise horas trabalhadas e vidas impactadas' },
    ],
  },
  register: {
    title: 'Veja o potencial dos seus atendimentos',
    description: 'Simule diferentes formatos de atendimento e compare faturamento, despesas, tempo de trabalho e pessoas impactadas.',
    benefits: [
      { icon: TrendingUp, label: 'Simulações rápidas' },
      { icon: ChartNoAxesCombined, label: 'Comparação lado a lado' },
      { icon: WalletCards, label: 'Resultados financeiros claros' },
      { icon: Heart, label: 'Indicadores de produtividade' },
    ],
  },
};

export const AuthShell = ({
  eyebrow,
  title,
  description,
  variant = 'login',
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  variant?: AuthVariant;
  children: ReactNode;
}) => {
  const content = panelContent[variant];

  return <main className="auth-page">
    <div className="auth-backdrop" aria-hidden="true" />
    <section className="auth-shell">
      <aside className="auth-brand-panel" aria-label="Sobre o PsiGestão">
        <div className="auth-brand-identity">
          <img className="auth-brand-logo" src="/psigestao-logo.png" alt="PsiGestão" />
          <p className="auth-brand-tagline">Calculadora de Resultados para Psicólogos</p>
        </div>
        <div className="auth-brand-content">
          <h2>{content.title}</h2>
          <p>{content.description}</p>
          <ul className="auth-benefit-list">
            {content.benefits.map(({ icon: Icon, label }) => <li key={label}><Icon size={17} aria-hidden="true" />{label}</li>)}
          </ul>
        </div>
        <div className="auth-trust-note">
          <LockKeyhole size={18} />
          <p><strong>Acesso protegido</strong><span>Seus dados são tratados com segurança.</span></p>
        </div>
        <small className="auth-asex-signature">Uma solução ASEX Educação</small>
      </aside>
      <div className="auth-card">
        <span className="auth-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
      </div>
    </section>
  </main>;
};
