import React from 'react';
import {
  Globe,
  LayoutDashboard,
  Users,
  CalendarDays,
  Video,
  ClipboardList,
  FileText,
  ClipboardCheck,
  Wallet,
  CreditCard,
  Settings,
  ShieldCheck,
  UserRound,
  LogOut,
  Stethoscope,
  BarChart3,
  X
} from 'lucide-react';

const navGroups = [
  {
    title: 'VISÃO GERAL',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'landing', label: 'Página Inicial (Site)', icon: Globe },
      { id: 'relatorios', label: 'Relatórios & Métricas', icon: BarChart3 }
    ]
  },
  {
    title: 'GESTÃO CLÍNICA',
    items: [
      { id: 'pacientes', label: 'Pacientes', icon: Users },
      { id: 'agenda', label: 'Agenda & Calendário', icon: CalendarDays },
      { id: 'online', label: 'Atendimentos On-line', icon: Video, live: true },
      { id: 'psicologos', label: 'Psicólogos', icon: UserRound },
      { id: 'prontuarios', label: 'Prontuários', icon: ClipboardList }
    ]
  },
  {
    title: 'RECURSOS & INSTRUMENTOS',
    items: [
      { id: 'documentos', label: 'Documentos e Laudos', icon: FileText },
      { id: 'testes', label: 'Correção de Testes', icon: ClipboardCheck },
      { id: 'financeiro', label: 'Financeiro & Caixa', icon: Wallet }
    ]
  },
  {
    title: 'CONTA & CONFORMIDADE',
    items: [
      { id: 'planos', label: 'Planos & Pagamentos', icon: CreditCard },
      { id: 'auditoria', label: 'Auditoria & LGPD', icon: ShieldCheck },
      { id: 'configuracoes', label: 'Configurações', icon: Settings }
    ]
  }
];

const initials = (name = 'Profissional') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();

export default function Sidebar({ page, setPage, user, onLogout, mobileOpen, closeMobile }) {
  return (
    <>
      {mobileOpen && <button className="scrim" aria-label="Fechar menu" onClick={closeMobile} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <img
            src="/logo-simbolo.png"
            alt="PsiConex"
            className="brand-logo-img"
          />
          <span style={{ marginLeft: 8 }}>
            <b>PsiConex</b>
            <small style={{ color: '#64748b', letterSpacing: '1px', fontWeight: 700 }}>SISTEMA PARA PSICÓLOGOS</small>
          </span>
          <button className="icon-button close-menu" onClick={closeMobile}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace">
          <span className="workspace-icon" style={{ background: '#e8f1fa', color: '#335b8c' }}>
            <Stethoscope size={18} />
          </span>
          <span>
            <b>Minha Clínica</b>
            <small>{user?.email || 'Espaço profissional'}</small>
          </span>
        </div>

        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-heading">{group.title}</p>
              {group.items.map(({ id, label, icon: Icon, live }) => (
                <button
                  key={id}
                  className={`nav-item ${page === id ? 'active' : ''}`}
                  onClick={() => {
                    setPage(id);
                    closeMobile();
                  }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {live && <small className="live-pill" style={{ background: '#d4e6f6', color: '#1e4066' }}>LIVE</small>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="avatar" style={{ background: '#e8f1fa', color: '#244368' }}>
              {initials(user?.nome)}
            </div>
            <span>
              <b>{user?.nome || 'Profissional'}</b>
              <small>
                {user?.is_admin_principal || (user?.papel === 'admin' && (user?.id === 1 || user?.email === 'admin@clinicapsico.com.br'))
                  ? 'Admin Principal'
                  : user?.papel === 'admin'
                  ? 'Administrador'
                  : 'Psicólogo(a)'}
              </small>
            </span>
            <button className="icon-button" title="Sair do sistema" onClick={onLogout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
