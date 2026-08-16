import { LockKeyhole } from 'lucide-react';
import { ReactNode } from 'react';

export const AuthShell = ({
  eyebrow,
  title,
  description,
  centerBrand = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centerBrand?: boolean;
  children: ReactNode;
}) => (
  <main className="auth-page">
    <div className="auth-backdrop" aria-hidden="true" />
    <section className="auth-shell">
      <div className={`auth-brand-panel${centerBrand ? ' auth-brand-panel-centered' : ''}`}>
        <div className="auth-brand-identity">
          <img className="auth-brand-logo" src="/asex-educacao-logo.png" alt="ASEX Educação" />
          <span className="auth-brand-caption">Calculadora de Resultados</span>
        </div>
        <div className="auth-trust-note">
          <LockKeyhole size={18} />
          <p><strong>Acesso protegido</strong><span>Ambiente exclusivo para agentes de expansão.</span></p>
        </div>
      </div>
      <div className="auth-card">
        <span className="auth-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
      </div>
    </section>
  </main>
);
