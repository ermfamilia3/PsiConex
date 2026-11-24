import React, { useState } from 'react';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';

const initials = (name = 'Profissional') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();

export default function Header({ pageTitle, user, onMenu }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState(false);

  return (
    <header className="topbar">
      <div className="crumb">
        <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Abrir menu">
          <Menu size={20} />
        </button>
        <img
          src="/logo-simbolo.png"
          alt="PsiConex"
          style={{ width: 28, height: 28, objectFit: 'contain', marginRight: 4, borderRadius: 6 }}
        />
        <span style={{ fontWeight: 800, color: '#335b8c', fontSize: 13 }}>PsiConex</span>
        <i>/</i>
        <b>{pageTitle}</b>
      </div>
      <div className="top-actions">
        <div className={`search-box ${searchOpen ? 'open' : ''}`}>
          {searchOpen && (
            <input
              autoFocus
              placeholder="Buscar no sistema..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          <button
            className="icon-button"
            onClick={() => {
              setSearchOpen(!searchOpen);
              setSearch('');
            }}
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>
        </div>
        <button
          className="icon-button bell"
          onClick={() => setNotifications(!notifications)}
          aria-label="Notificações"
        >
          <Bell size={18} />
          <i />
        </button>
        <div className="top-profile">
          <div className="avatar" style={{ background: '#e8f1fa', color: '#244368' }}>
            {initials(user?.nome)}
          </div>
          <span>
            <b>{user?.nome?.split(' ')[0] || 'Profissional'}</b>
            <small>{user?.papel === 'admin' ? 'Administrador(a)' : 'Psicólogo(a)'}</small>
          </span>
        </div>
        {notifications && (
          <div className="notification-popover">
            <b style={{ color: '#335b8c' }}>PsiConex · Notificações</b>
            <p style={{ marginTop: 8 }}>✅ Todas as integrações ativas (Jitsi Meet, Mercado Pago, PDF).</p>
            <p>Seus dados clínicos estão sincronizados e protegidos com criptografia.</p>
          </div>
        )}
      </div>
    </header>
  );
}
