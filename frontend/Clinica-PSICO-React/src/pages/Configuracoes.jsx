import React, { useEffect, useState } from 'react';
import { Settings, Save, Check, ShieldCheck, X } from 'lucide-react';
import { Heading } from '../components/UI';
import { obterConfiguracoes, salvarConfiguracoes } from '../services/api';

export default function ConfiguracoesPage({ user }) {
  const [configs, setConfigs] = useState({
    nome_clinica: '',
    email_contato: '',
    telefone: '',
    endereco: '',
    modalidade_padrao: 'Híbrido',
    termo_lgpd: 'Autorizo o tratamento de dados pessoais sensíveis estritamente para a finalidade de acompanhamento psicológico.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const c = await obterConfiguracoes();
        setConfigs((prev) => ({ ...prev, ...c }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await salvarConfiguracoes(configs);
      setNotice('Configurações da clínica salvas com sucesso!');
    } catch (err) {
      setError(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content">
      <Heading
        title="Configurações da Clínica"
        subtitle="Gerencie os dados institucionais, preferências de atendimento e termos da LGPD."
      />

      {notice && (
        <div className="notice inline-notice">
          {notice}
          <button onClick={() => setNotice('')}>
            <X size={15} />
          </button>
        </div>
      )}
      {error && <div className="alert-error">{error}</div>}

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Dados da Clínica / Consultório</h3>
              <p>Informações exibidas no cabeçalho dos documentos e recibos em PDF</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="field-label">
              Nome da Clínica / Consultório
              <input
                className="plain-input"
                value={configs.nome_clinica || ''}
                onChange={(e) => setConfigs({ ...configs, nome_clinica: e.target.value })}
                placeholder="Ex: Clínica PSICO — Psicologia Integrada"
                required
              />
            </label>

            <div className="form-grid">
              <label className="field-label">
                E-mail institucional
                <input
                  className="plain-input"
                  type="email"
                  value={configs.email_contato || ''}
                  onChange={(e) => setConfigs({ ...configs, email_contato: e.target.value })}
                />
              </label>
              <label className="field-label">
                Telefone de contato / WhatsApp
                <input
                  className="plain-input"
                  value={configs.telefone || ''}
                  onChange={(e) => setConfigs({ ...configs, telefone: e.target.value })}
                />
              </label>
            </div>

            <label className="field-label">
              Endereço físico
              <input
                className="plain-input"
                value={configs.endereco || ''}
                onChange={(e) => setConfigs({ ...configs, endereco: e.target.value })}
                placeholder="Av. Paulista, 1000, cj. 52 - Bela Vista, São Paulo - SP"
              />
            </label>

            <label className="field-label">
              Modalidade principal de atendimento
              <select
                className="plain-input"
                value={configs.modalidade_padrao || 'Híbrido'}
                onChange={(e) => setConfigs({ ...configs, modalidade_padrao: e.target.value })}
              >
                <option>Híbrido (Presencial e On-line)</option>
                <option>Exclusivamente On-line</option>
                <option>Exclusivamente Presencial</option>
              </select>
            </label>

            <label className="field-label">
              Texto padrão do Termo de Consentimento LGPD
              <textarea
                className="plain-input"
                rows="3"
                value={configs.termo_lgpd || ''}
                onChange={(e) => setConfigs({ ...configs, termo_lgpd: e.target.value })}
              />
            </label>

            <div style={{ marginTop: 10 }}>
              <button className="primary-button" disabled={saving}>
                <Save size={15} style={{ marginRight: 6 }} /> {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Conta e Segurança</h3>
              <p>Credenciais e nível de acesso</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 12, background: '#f8faf9', borderRadius: 8, border: '1px solid #edf2ee' }}>
              <b style={{ fontSize: 11, color: '#385043', display: 'block' }}>Usuário Conectado</b>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1f2e26' }}>{user?.nome}</span>
              <small style={{ display: 'block', color: '#6b7a72' }}>{user?.email}</small>
              <div style={{ marginTop: 8 }}>
                <span className="audit-badge" style={{ textTransform: 'uppercase' }}>
                  Perfil: {user?.papel}
                </span>
              </div>
            </div>

            <div style={{ padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #e0f2fe' }}>
              <b style={{ fontSize: 11, color: '#0369a1', display: 'block' }}>Banco de Dados & Backup</b>
              <p style={{ fontSize: 11, color: '#0c4a6e', margin: '4px 0 0', lineHeight: 1.5 }}>
                Os dados são armazenados no <strong>Supabase (PostgreSQL)</strong> com backup diário automático gerenciado na nuvem e criptografia em repouso.
              </p>
              <code style={{ display: 'block', marginTop: 6, fontSize: 10, background: '#e0f2fe', padding: 6, borderRadius: 4 }}>
                Supabase PostgreSQL · Conexão SSL Ativa
              </code>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
