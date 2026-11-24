import React, { useState } from 'react';
import { Sparkles, Check, ShieldCheck, LockKeyhole, Mail, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { API_URL } from '../services/api';

export default function LoginScreen({ onLogin, onVoltarSite }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onLogin(email, senha);
    } catch (err) {
      setError(err.message || 'Não foi possível acessar. Verifique seus dados.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-layout">
      <section className="login-visual" style={{ background: 'linear-gradient(145deg, #1d4573 0%, #335b8c 100%)' }}>
        <div className="brand" style={{ gap: 16, alignItems: 'center' }}>
          <img
            src="/logo-simbolo.png"
            alt="PsiConex"
            style={{
              width: 58,
              height: 58,
              borderRadius: 14,
              background: 'white',
              padding: 5,
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)'
            }}
          />
          <div>
            <b style={{ fontSize: 24, color: 'white', letterSpacing: '-0.5px' }}>PsiConex</b>
            <div style={{ color: '#d0e3f7', fontSize: 11, letterSpacing: '1px', fontWeight: 700, marginTop: 2 }}>
              SISTEMA PARA PSICÓLOGOS
            </div>
          </div>
        </div>
        <div className="visual-copy">
          <span className="eyebrow light">
            <Sparkles size={14} /> PRATICIDADE INTEGRADA EM UM SÓ LUGAR
          </span>
          <h1>
            Mais tempo para cuidar.
            <br />
            <em>Mais leveza</em> para gerir.
          </h1>
          <p>
            Plataforma clínica completa: agendamentos com videochamada Jitsi Meet integrada, prontuários seguros com criptografia,
            emissão de documentos em PDF e controle financeiro integrado ao Mercado Pago.
          </p>
          <div className="visual-points">
            <span>
              <Check size={16} /> Prontuário com evolução e histórico clínico
            </span>
            <span>
              <Check size={16} /> Videochamada online segura e sem limites
            </span>
            <span>
              <Check size={16} /> Adequação às normas do CFP e LGPD
            </span>
          </div>
        </div>
        <div className="visual-footer">
          <ShieldCheck size={16} /> Ambiente seguro com criptografia e auditoria
        </div>
        <div className="decor decor-a" />
        <div className="decor decor-b" />
      </section>

      <section className="login-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {onVoltarSite ? (
            <button
              type="button"
              className="text-button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#335b8c', fontSize: 12, fontWeight: 700 }}
              onClick={onVoltarSite}
            >
              <ArrowLeft size={15} /> Voltar para o Site
            </button>
          ) : <div />}

          <div className="secure-label" style={{ margin: 0 }}>
            <LockKeyhole size={14} /> Acesso seguro JWT
          </div>
        </div>

        <form className="login-form" onSubmit={submit} style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <img
              src="/logo-simbolo.png"
              alt="PsiConex"
              style={{
                width: 48,
                height: 48,
                objectFit: 'contain',
                borderRadius: 10,
                background: 'white',
                border: '1.5px solid #c2d9ee',
                padding: 3,
                boxShadow: '0 4px 12px rgba(51, 91, 140, 0.12)'
              }}
            />
            <div>
              <div style={{ font: '800 22px Manrope, sans-serif', color: '#335b8c', lineHeight: 1.1 }}>PsiConex</div>
              <small style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px' }}>
                SISTEMA PARA PSICÓLOGOS
              </small>
            </div>
          </div>
          <div className="form-heading">
            <span className="eyebrow" style={{ color: '#335b8c' }}>PSICONEX · PLATAFORMA</span>
            <h2>Entre no seu painel</h2>
            <p>Acesse seu espaço de cuidado, prontuários e gestão clínica.</p>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <label className="field-label">
            E-mail profissional
            <div className="input-wrap">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@clinicapsico.com.br"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="field-label">
            Senha
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
              <button
                className="icon-button"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar ou ocultar senha"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <button className="primary-button full" disabled={busy} style={{ background: '#335b8c' }}>
            {busy ? 'Autenticando...' : 'Entrar na plataforma'}{' '}
            <ArrowRight size={17} />
          </button>

          <div style={{
            marginTop: 22,
            padding: '12px 14px',
            background: '#e8f1fa',
            border: '1px solid #c2d9ee',
            borderRadius: 9,
            fontSize: 11,
            color: '#244368',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <ShieldCheck size={20} style={{ flexShrink: 0, color: '#335b8c' }} />
            <span>
              <strong>Acesso Restrito:</strong> Novos psicólogos e colaboradores são cadastrados exclusivamente pelo Administrador da clínica.
            </span>
          </div>

          <div className="api-note">
            <span className="status-dot" /> Backend conectado: <code>{API_URL}</code>
          </div>
        </form>
      </section>
    </div>
  );
}
