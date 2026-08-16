import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, UserRoundCheck, UserRoundX, X } from 'lucide-react';
import { api, ApiError, User, UserRole, UserStatus } from '../auth/api';
import { useAuth } from '../auth/AuthContext';
import { AppPageShell } from '../components/AppPageShell';
import { formatBrazilianPhone } from '../utils/formatters';

interface PendingAction {
  user: User;
  patch: { role?: UserRole; status?: UserStatus };
  title: string;
  message: string;
}

const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Nunca';

export const AdminPage = () => {
  const { refreshUser, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [selected, setSelected] = useState<User | null>(null);

  const loadUsers = async (event?: FormEvent) => {
    event?.preventDefault();
    setLoading(true);
    setMessage('');
    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (role) query.set('role', role);
    if (status) query.set('status', status);
    try {
      const response = await api<{ users: User[] }>(`/api/admin/users?${query}`);
      setUsers(response.users);
    } catch (error) {
      setMessage((error as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    // Initial administrative list only; filters are submitted explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.status === 'active').length,
    admins: users.filter((user) => user.role === 'admin').length,
  }), [users]);

  const confirmAction = async () => {
    if (!pending) return;
    setMessage('');
    try {
      const response = await api<{ message: string; user: User }>(`/api/admin/users/${encodeURIComponent(pending.user.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(pending.patch),
      });
      setUsers((current) => current.map((user) => user.id === response.user.id ? response.user : user));
      setSelected((current) => current?.id === response.user.id ? response.user : current);
      setMessage(response.message);
      if (response.user.id === currentUser?.id) await refreshUser();
      setPending(null);
    } catch (error) {
      setMessage((error as ApiError).message);
      setPending(null);
    }
  };

  const askRoleChange = (user: User, nextRole: UserRole) => {
    if (nextRole === user.role) return;
    setPending({ user, patch: { role: nextRole }, title: 'Alterar perfil', message: 'Deseja realmente alterar o perfil deste usuário?' });
  };

  const askStatusChange = (user: User) => {
    const blocking = user.status === 'active';
    setPending({
      user,
      patch: { status: blocking ? 'blocked' : 'active' },
      title: blocking ? 'Bloquear usuário' : 'Desbloquear usuário',
      message: blocking ? 'Deseja realmente bloquear este usuário?' : 'Deseja realmente desbloquear este usuário? Um novo login será necessário.',
    });
  };

  return (
    <AppPageShell eyebrow="ADMINISTRAÇÃO" title="Gestão de usuários">
      <div className="admin-stats"><div><span>Usuários</span><strong>{totals.total}</strong></div><div><span>Ativos</span><strong>{totals.active}</strong></div><div><span>Administradores</span><strong>{totals.admins}</strong></div></div>
      <section className="admin-card">
        <form className="admin-filters" onSubmit={loadUsers}>
          <label className="admin-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, telefone ou e-mail" aria-label="Buscar usuários" /></label>
          <select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filtrar por perfil"><option value="">Todos os perfis</option><option value="agent">Agente</option><option value="admin">Administrador</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status"><option value="">Todos os status</option><option value="active">Ativo</option><option value="blocked">Bloqueado</option></select>
          <button type="submit" disabled={loading}>{loading ? 'Buscando…' : 'Filtrar'}</button>
        </form>
        {message ? <div className="form-alert form-alert-info" role="status">{message}</div> : null}
        <div className="admin-table-shell">
          <table className="admin-table">
            <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Cadastro</th><th>Último acesso</th><th>Ações</th></tr></thead>
            <tbody>
              {!loading && users.length === 0 ? <tr><td colSpan={8} className="admin-empty">Nenhum usuário encontrado.</td></tr> : null}
              {users.map((user) => (
                <tr key={user.id}>
                  <td data-label="Nome"><button className="user-detail-button" type="button" onClick={() => setSelected(user)}>{user.name}</button></td>
                  <td data-label="Telefone">{formatBrazilianPhone(user.phone)}</td>
                  <td data-label="E-mail">{user.email}</td>
                  <td data-label="Perfil"><select value={user.role} onChange={(event) => askRoleChange(user, event.target.value as UserRole)} aria-label={`Perfil de ${user.name}`}><option value="agent">Agente</option><option value="admin">Administrador</option></select></td>
                  <td data-label="Status"><span className={user.status === 'active' ? 'user-status user-status-active' : 'user-status user-status-blocked'}>{user.status === 'active' ? 'Ativo' : 'Bloqueado'}</span></td>
                  <td data-label="Cadastro">{formatDate(user.createdAt)}</td>
                  <td data-label="Último acesso">{formatDate(user.lastLoginAt)}</td>
                  <td data-label="Ações"><button className={user.status === 'active' ? 'admin-action admin-action-danger' : 'admin-action'} type="button" onClick={() => askStatusChange(user)}>{user.status === 'active' ? <><UserRoundX size={15} /> Bloquear</> : <><UserRoundCheck size={15} /> Desbloquear</>}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {pending ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPending(null)}>
          <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title">
            <div className="confirm-icon"><ShieldCheck size={24} /></div><h2 id="admin-confirm-title">{pending.title}</h2><p>{pending.message}</p><strong>{pending.user.name}</strong>
            <div className="confirm-actions"><button type="button" onClick={() => setPending(null)}>Cancelar</button><button type="button" className="confirm-primary" onClick={confirmAction}>Confirmar alteração</button></div>
          </div>
        </div>
      ) : null}
      {selected ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
            <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Fechar"><X size={20} /></button>
            <span className="page-eyebrow">DETALHES DO USUÁRIO</span><h2 id="user-detail-title">{selected.name}</h2>
            <dl><div><dt>Telefone</dt><dd>{formatBrazilianPhone(selected.phone)}</dd></div><div><dt>E-mail</dt><dd>{selected.email}</dd></div><div><dt>Perfil</dt><dd>{selected.role === 'admin' ? 'Administrador' : 'Agente'}</dd></div><div><dt>Status</dt><dd>{selected.status === 'active' ? 'Ativo' : 'Bloqueado'}</dd></div><div><dt>Cadastro</dt><dd>{formatDate(selected.createdAt)}</dd></div><div><dt>Último acesso</dt><dd>{formatDate(selected.lastLoginAt)}</dd></div></dl>
          </div>
        </div>
      ) : null}
    </AppPageShell>
  );
};
