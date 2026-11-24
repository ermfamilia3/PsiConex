import React, { useEffect, useState } from 'react';
import { Flower2 } from 'lucide-react';

import { login, logout, obterUsuarioAtual, temToken } from './services/api';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import PatientsPage from './pages/Pacientes';
import PsicologosPage from './pages/Psicologos';
import AgendaPage from './pages/Agenda';
import AtendimentoOnlinePage from './pages/AtendimentoOnline';
import ProntuariosPage from './pages/Prontuarios';
import DocumentosPage from './pages/Documentos';
import TestesPage from './pages/Testes';
import FinanceiroPage from './pages/Financeiro';
import PlanosPage from './pages/Planos';
import RelatoriosPage from './pages/Relatorios';
import AuditoriaPage from './pages/Auditoria';
import ConfiguracoesPage from './pages/Configuracoes';

const titulosPaginas = {
  landing: 'Página Inicial (Site)',
  dashboard: 'Visão Geral',
  pacientes: 'Pacientes',
  agenda: 'Agenda & Calendário',
  online: 'Atendimento On-line',
  psicologos: 'Psicólogos',
  prontuarios: 'Prontuários Clínicos',
  documentos: 'Documentos e Laudos',
  testes: 'Correção de Testes',
  financeiro: 'Financeiro & Caixa',
  planos: 'Planos & Assinaturas',
  relatorios: 'Relatórios Gerenciais',
  auditoria: 'Auditoria & LGPD',
  configuracoes: 'Configurações'
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(temToken());
  const [user, setUser] = useState(null);
  // A tela inicial agora é a Landing Page conforme solicitado
  const [page, setPage] = useState('landing');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(temToken());
  const [agendamentoAtivoVideo, setAgendamentoAtivoVideo] = useState(null);

  useEffect(() => {
    let active = true;
    if (!temToken()) {
      setLoading(false);
      return;
    }
    obterUsuarioAtual()
      .then((u) => {
        if (active) {
          setUser(u);
          setAuthenticated(true);
        }
      })
      .catch(() => {
        logout();
        if (active) {
          setAuthenticated(false);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(email, senha) {
    await login(email, senha);
    const current = await obterUsuarioAtual();
    setUser(current);
    setAuthenticated(true);
    setPage('dashboard');
  }

  function handleLogout() {
    logout();
    setAuthenticated(false);
    setUser(null);
    setPage('landing');
  }

  function entrarNaSalaVideo(agendamento) {
    setAgendamentoAtivoVideo(agendamento);
    setPage('online');
  }

  if (loading) {
    return (
      <div className="loading">
        <img
          src="/logo-simbolo.png"
          alt="PsiConex"
          style={{
            width: 76,
            height: 76,
            borderRadius: 18,
            background: 'white',
            padding: 8,
            border: '2px solid #c2d9ee',
            boxShadow: '0 8px 24px rgba(51, 91, 140, 0.15)'
          }}
        />
        <b style={{ color: '#335b8c', fontSize: 22, marginTop: 10 }}>PsiConex</b>
        <span style={{ color: '#64748b', fontSize: 12 }}>Carregando sua clínica segura...</span>
      </div>
    );
  }

  // 1. TELA INICIAL (LANDING PAGE)
  if (page === 'landing') {
    return (
      <LandingPage
        onEntrar={() => setPage('login')}
        onComecar={() => setPage('login')}
        authenticated={authenticated}
        user={user}
        onIrPainel={() => setPage('dashboard')}
      />
    );
  }

  // 2. TELA DE LOGIN (se não autenticado ou se clicou em Entrar)
  if (!authenticated || page === 'login') {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onVoltarSite={() => setPage('landing')}
      />
    );
  }

  // 3. AMBIENTE INTERNO DA PLATAFORMA (DASHBOARD E DEMAIS MÓDULOS)
  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />

      <main className="main-area">
        <Header
          pageTitle={titulosPaginas[page] || 'PsiConex'}
          user={user}
          onMenu={() => setMobileOpen(true)}
        />

        <div className="content-wrap">
          {page === 'dashboard' && <Dashboard user={user} go={setPage} />}
          {page === 'pacientes' && <PatientsPage />}
          {page === 'agenda' && <AgendaPage onEntrarVideo={entrarNaSalaVideo} />}
          {page === 'online' && <AtendimentoOnlinePage agendamentoAtivo={agendamentoAtivoVideo} />}
          {page === 'psicologos' && <PsicologosPage user={user} />}
          {page === 'prontuarios' && <ProntuariosPage />}
          {page === 'documentos' && <DocumentosPage />}
          {page === 'testes' && <TestesPage />}
          {page === 'financeiro' && <FinanceiroPage />}
          {page === 'planos' && <PlanosPage />}
          {page === 'relatorios' && <RelatoriosPage />}
          {page === 'auditoria' && <AuditoriaPage />}
          {page === 'configuracoes' && <ConfiguracoesPage user={user} />}
        </div>

        <footer className="app-footer">
          <span>© 2026 PsiConex — Praticidade integrada em um só lugar.</span>
          <span>
            <i className="status-dot" style={{ background: '#335b8c' }} /> Sistema para Psicólogos · React + FastAPI + MySQL
          </span>
        </footer>
      </main>
    </div>
  );
}
