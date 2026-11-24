import React from 'react';
import {
  Users,
  CalendarDays,
  ClipboardList,
  Wallet,
  FileText,
  Video,
  Check,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';

export default function LandingPage({ onEntrar, onComecar, authenticated, user, onIrPainel }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-container">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER DA LANDING PAGE
      ───────────────────────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="landing-brand">
          <img src="/logo-simbolo.png" alt="PsiConex Logo" className="landing-brand-logo" />
          <div className="landing-brand-text">
            <span className="brand-name">PsiConex</span>
            <span className="brand-sub">SISTEMA PARA PSICÓLOGOS</span>
          </div>
        </div>

        <nav className="landing-nav-links">
          <a href="#inicio" onClick={(e) => { e.preventDefault(); scrollTo('inicio'); }}>Início</a>
          <a href="#recursos" onClick={(e) => { e.preventDefault(); scrollTo('recursos'); }}>Recursos</a>
          <a href="#psicologia" onClick={(e) => { e.preventDefault(); scrollTo('recursos'); }}>Psicologia</a>
          <a href="#planos" onClick={(e) => { e.preventDefault(); scrollTo('planos'); }}>Planos</a>
          <a href="#sobre" onClick={(e) => { e.preventDefault(); scrollTo('sobre'); }}>Sobre</a>
        </nav>

        <div className="landing-nav-actions">
          {authenticated ? (
            <button className="landing-btn-entrar" onClick={onIrPainel}>
              Acessar Painel <ArrowRight size={15} style={{ marginLeft: 6 }} />
            </button>
          ) : (
            <button className="landing-btn-entrar" onClick={onEntrar}>
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION (BANNER AZUL #335b8c)
      ───────────────────────────────────────────────────────────── */}
      <section className="landing-hero" id="inicio">
        <div className="landing-hero-content">
          <div className="landing-hero-left">
            <div className="hero-brand-badge">
              <img src="/logo-simbolo.png" alt="PsiConex" />
              <span>PsiConex · Praticidade integrada em um só lugar</span>
            </div>
            <h1>Gestão simples para uma clínica de psicologia mais organizada.</h1>
            <p>
              Tenha pacientes, agenda, registros clínicos, financeiro e documentos em uma única
              plataforma criada para a rotina do profissional de psicologia.
            </p>
            <div className="landing-hero-buttons">
              <button className="landing-hero-btn-primary" onClick={authenticated ? onIrPainel : onComecar}>
                COMEÇAR AGORA
              </button>
              <button className="landing-hero-btn-secondary" onClick={() => scrollTo('recursos')}>
                CONHECER RECURSOS
              </button>
            </div>
          </div>

          <div className="landing-hero-right">
            {/* Card flutuante de visão geral idêntico à imagem */}
            <div className="landing-preview-card">
              <div className="landing-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/logo-simbolo.png" alt="PsiConex" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  <b>Visão geral da clínica</b>
                </div>
                <span>Hoje</span>
              </div>

              <div className="landing-card-stats">
                <div className="landing-stat-box">
                  <small>Consultas</small>
                  <b>08</b>
                  <span className="badge-up">+12% hoje</span>
                </div>

                <div className="landing-stat-box">
                  <small>Pacientes</small>
                  <b>124</b>
                  <span className="badge-info">6 novos</span>
                </div>

                <div className="landing-stat-box">
                  <small>Agenda</small>
                  <b>Hoje</b>
                  <span className="badge-sub">4 atendimentos</span>
                </div>
              </div>

              <div className="landing-card-footer">
                <b>Sua rotina em um só lugar</b>
                <p>Mais organização para você dedicar mais tempo ao cuidado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SEÇÃO DE RECURSOS (TUDO O QUE SUA CLÍNICA PRECISA)
      ───────────────────────────────────────────────────────────── */}
      <section className="landing-features-section" id="recursos">
        <div className="landing-section-heading">
          <h2>Tudo o que sua clínica precisa</h2>
          <p>Recursos pensados para facilitar a gestão do dia a dia.</p>
        </div>

        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="feature-number">01</div>
            <div className="feature-info">
              <b>Pacientes</b>
              <p>Cadastre e acompanhe seus pacientes.</p>
            </div>
          </div>

          <div className="landing-feature-card">
            <div className="feature-number">02</div>
            <div className="feature-info">
              <b>Agenda</b>
              <p>Organize consultas presenciais e online.</p>
            </div>
          </div>

          <div className="landing-feature-card">
            <div className="feature-number">03</div>
            <div className="feature-info">
              <b>Prontuários</b>
              <p>Registre informações clínicas com organização.</p>
            </div>
          </div>

          <div className="landing-feature-card">
            <div className="feature-number">04</div>
            <div className="feature-info">
              <b>Financeiro</b>
              <p>Acompanhe receitas e pendências.</p>
            </div>
          </div>

          <div className="landing-feature-card">
            <div className="feature-number">05</div>
            <div className="feature-info">
              <b>Documentos</b>
              <p>Emita documentos e relatórios com agilidade.</p>
            </div>
          </div>

          <div className="landing-feature-card">
            <div className="feature-number">06</div>
            <div className="feature-info">
              <b>Atendimento online</b>
              <p>Recursos para consultas virtuais.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. SEÇÃO DE PLANOS (ESCOLHA O PLANO IDEAL PARA SUA ROTINA)
      ───────────────────────────────────────────────────────────── */}
      <section className="landing-plans-section" id="planos">
        <div className="landing-plans-wrapper">
          <div className="landing-plans-header">
            <span className="landing-plans-pill">Escolha o plano ideal para sua rotina</span>
            <p>Comece com o essencial ou tenha acesso a todos os recursos da plataforma.</p>
          </div>

          <div className="landing-plans-grid">
            {/* PLANO BÁSICO */}
            <div className="landing-plan-card">
              <span className="plan-name">BÁSICO</span>
              <p className="plan-sub">Para organizar sua rotina clínica.</p>
              
              <div className="plan-price-tag">
                <b>R$ 69,00</b>
                <small>por profissional / mês</small>
              </div>

              <ul className="plan-items">
                <li><Check size={16} /> <span>Agenda online</span></li>
                <li><Check size={16} /> <span>Cadastro de pacientes</span></li>
                <li><Check size={16} /> <span>Prontuários</span></li>
                <li><Check size={16} /> <span>Gestão financeira</span></li>
                <li><Check size={16} /> <span>Documentos</span></li>
              </ul>

              <button className="plan-action-btn" onClick={authenticated ? onIrPainel : onComecar}>
                ESCOLHER BÁSICO
              </button>
            </div>

            {/* PLANO PREMIUM */}
            <div className="landing-plan-card featured">
              <span className="plan-name">PREMIUM</span>
              <p className="plan-sub">Mais recursos para uma gestão completa.</p>
              
              <div className="plan-price-tag">
                <b>R$ 110,00</b>
                <small>por profissional / mês</small>
              </div>

              <ul className="plan-items">
                <li><Check size={16} /> <span>Tudo do plano Básico</span></li>
                <li><Check size={16} /> <span>Atendimento online</span></li>
                <li><Check size={16} /> <span>Correção de testes</span></li>
                <li><Check size={16} /> <span>Relatórios avançados</span></li>
              </ul>

              <button className="plan-action-btn" onClick={authenticated ? onIrPainel : onComecar}>
                ESCOLHER PREMIUM
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. FOOTER AZUL (IDÊNTICO À IMAGEM)
      ───────────────────────────────────────────────────────────── */}
      <footer className="landing-footer" id="sobre">
        <div className="landing-footer-content">
          <div className="landing-footer-left">
            <h3>Tecnologia para apoiar o cuidado psicológico</h3>
            <p>Organização, praticidade e recursos digitais para apoiar o profissional — sem substituir o olhar clínico.</p>
          </div>

          <div className="landing-footer-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src="/logo-simbolo.png"
              alt="PsiConex"
              style={{
                width: 48,
                height: 48,
                background: 'white',
                borderRadius: 12,
                padding: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
              }}
            />
            <div>
              <div className="footer-brand-title">PsiConex · CLÍNICA PSICO</div>
              <div className="footer-brand-sub">Gestão clínica inteligente · Sistema para Psicólogos</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
