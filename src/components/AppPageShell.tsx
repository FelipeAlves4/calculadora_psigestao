import { ArrowLeft, BarChart3, LogOut } from 'lucide-react';
import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const AppPageShell = ({ title, eyebrow, children, backTo = '/calculadora' }: { title: string; eyebrow: string; children: ReactNode; backTo?: string }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const logout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-page">
      <header className="app-page-header">
        <Link to="/calculadora" className="app-page-brand"><BarChart3 size={21} /><span>ASEX Educação</span></Link>
        <div className="app-page-user"><span>{user?.name}</span><button type="button" onClick={logout}><LogOut size={17} /> Sair</button></div>
      </header>
      <main className="app-page-content">
        <Link to={backTo} className="back-link"><ArrowLeft size={16} /> Voltar</Link>
        <span className="page-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
};
