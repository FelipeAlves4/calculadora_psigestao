import { BarChart3, ChevronDown, ClipboardList, Download, Eraser, LockKeyhole, LogOut, Maximize2, Presentation, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  brandName?: string;
  brandNote?: string;
  userLabel?: string;
  onExample: () => void;
  onClear: () => void;
  onPrint: () => void;
  onFullscreen: () => void;
  presentationMode: boolean;
  onTogglePresentation: () => void;
  userName: string;
  isAdmin: boolean;
  onLogout: () => Promise<void>;
}

export const Header = ({
  title = 'Calculadora de Resultados',
  subtitle = 'Diagnóstico financeiro premium para comparar o cenário atual com o resultado projetado.',
  brandName = 'ASEX Educação',
  brandNote,
  userLabel = 'Agente conectado',
  onExample,
  onClear,
  onPrint,
  onFullscreen,
  presentationMode,
  onTogglePresentation,
  userName,
  isAdmin,
  onLogout,
}: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return <header className="site-header">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="brand-pill">
            <BarChart3 size={17} />
            {brandName}
          </div>
          <h1 className="site-title">{title}</h1>
          <p className="site-subtitle">{subtitle}</p>
          {brandNote ? <p className="mt-2 text-xs font-medium text-slate-400">{brandNote}</p> : null}
        </div>

        <div className="header-side">
          <div className="header-actions">
          <button type="button" className="primary-button" onClick={onExample}>
            <ClipboardList size={17} />
            Exemplo
          </button>
          <button type="button" className="secondary-button" onClick={onClear}>
            <Eraser size={17} />
            Limpar calculadora
          </button>
          <button type="button" className="secondary-button secondary-action" onClick={onPrint}>
            <Download size={17} />
            Exportar PDF
          </button>
          <button type="button" className="secondary-button secondary-action" onClick={onFullscreen}>
            <Maximize2 size={17} />
            Tela cheia
          </button>
          <button
            type="button"
            className={presentationMode ? 'primary-button' : 'secondary-button'}
            onClick={onTogglePresentation}
          >
            <Presentation size={17} />
            Apresentação
          </button>
          </div>

          <div className="user-menu">
            <button type="button" className="user-menu-trigger" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>
              <span className="user-avatar"><UserRound size={17} /></span>
              <span className="user-menu-name"><small>{userLabel}</small><strong>{userName}</strong></span>
              <ChevronDown size={17} />
            </button>
            {menuOpen ? (
              <div className="user-menu-popover">
                <Link to="/minha-conta" onClick={() => setMenuOpen(false)}><UserRound size={16} /> Minha conta</Link>
                <Link to="/alterar-senha" onClick={() => setMenuOpen(false)}><LockKeyhole size={16} /> Alterar senha</Link>
                {isAdmin ? <Link to="/admin" onClick={() => setMenuOpen(false)}><ShieldCheck size={16} /> Área administrativa</Link> : null}
                <button type="button" onClick={() => void onLogout()}><LogOut size={16} /> Sair</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  </header>;
};
