import { CalendarDays, LockKeyhole, UsersRound, WalletCards } from 'lucide-react';
import { ReactNode } from 'react';

type AuthVariant = 'login' | 'register';

const panelContent: Record<AuthVariant, { title: string; description: string; benefits: Array<{ icon: typeof UsersRound; label: string }> }> = {
  login: {
    title: 'Sua prática clínica, organizada.',
    description: 'Centralize pacientes, atendimentos, agenda e resultados em um só lugar.',
    benefits: [
      { icon: UsersRound, label: 'Gestão de pacientes' },
      { icon: CalendarDays, label: 'Organização dos atendimentos' },
      { icon: WalletCards, label: 'Controle financeiro e agenda' },
    ],
  },
  register: {
    title: 'Mais organização para você. Mais atenção para seus pacientes.',
    description: 'Centralize sua rotina profissional e reduza o tempo gasto com tarefas administrativas.',
    benefits: [
      { icon: CalendarDays, label: 'Agenda organizada' },
      { icon: UsersRound, label: 'Informações dos pacientes centralizadas' },
      { icon: WalletCards, label: 'Gestão financeira' },
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
          <p className="auth-brand-tagline">Gestão inteligente para sua prática clínica</p>
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
