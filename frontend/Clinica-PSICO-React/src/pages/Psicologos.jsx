import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Stethoscope } from 'lucide-react';
import { Heading, Badge } from '../components/UI';
import Modal from '../components/Modal';
import { listarPsicologos, criarPsicologo, atualizarPsicologo, excluirPsicologo } from '../services/api';

const initials = (name = 'Psicólogo') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();

export default function PsicologosPage({ user }) {
  const isAdmin = user?.papel === 'admin';

  const emptyForm = {
    nome: '',
    crp: '',
    especialidade: '',
    email: '',
    telefone: '',
    abordagem: '',
    status: 'Ativo',
    senha: ''
  };

  const [psicologos, setPsicologos] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setPsicologos(await listarPsicologos());
    } catch (e) {
      setError(e.message || 'Não foi possível carregar os psicólogos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = psicologos.filter((p) =>
    `${p.nome} ${p.crp} ${p.especialidade || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  function startNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  }

  function startEdit(p) {
    setEditing(p);
    setForm({ ...emptyForm, ...p });
    setError('');
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await atualizarPsicologo(editing.id, form);
      } else {
        await criarPsicologo(form);
      }
      setOpen(false);
      setNotice(editing ? 'Psicólogo atualizado com sucesso.' : 'Psicólogo cadastrado com sucesso.');
      await load();
    } catch (e) {
      setError(e.message || 'Não foi possível salvar o profissional.');
    }
  }

  async function remove(id) {
    if (!window.confirm('Excluir este psicólogo da clínica?')) return;
    try {
      await excluirPsicologo(id);
      setNotice('Profissional removido com sucesso.');
      await load();
    } catch (e) {
      setError(e.message || 'Não foi possível excluir.');
    }
  }

  return (
    <div className="page-content">
      <Heading
        title="Corpo Clínico & Psicólogos"
        subtitle="Gerenciamento de profissionais, registro no CRP e especialidades da equipe."
        action={isAdmin ? "Novo psicólogo" : undefined}
        onAction={isAdmin ? startNew : undefined}
      />

      {!isAdmin && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: '#f4f8fc',
          border: '1px solid #c2d9ee',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 11,
          color: '#244368'
        }}>
          <span>🔒 <strong>Modo somente leitura:</strong> Apenas o Administrador principal tem permissão para cadastrar, editar ou remover psicólogos.</span>
        </div>
      )}

      {notice && (
        <div className="notice inline-notice">
          {notice}
          <button onClick={() => setNotice('')}>
            <X size={15} />
          </button>
        </div>
      )}
      {error && !open && <div className="alert-error">{error}</div>}

      <div className="metric-row">
        <div>
          <span>Profissionais cadastrados</span>
          <b>{psicologos.length}</b>
        </div>
        <div>
          <span>Profissionais ativos</span>
          <b>{psicologos.filter((p) => p.status === 'Ativo').length}</b>
        </div>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3>Psicólogos da Clínica</h3>
            <p>{psicologos.length} profissional(is) cadastrados</p>
          </div>
          <label className="table-search">
            <Search size={15} />
            <input
              placeholder="Buscar por nome, CRP ou especialidade..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {loading ? (
          <div className="empty">Carregando psicólogos...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Profissional</th>
                  <th>CRP</th>
                  <th>Especialidade / Abordagem</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <div className="person-cell">
                        <span className={`person-avatar tone-${i % 4}`}>{initials(p.nome)}</span>
                        <span>
                          <b>{p.nome}</b>
                          <small>ID #{p.id}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <b>{p.crp}</b>
                    </td>
                    <td>
                      <div>{p.especialidade || 'Psicologia Geral'}</div>
                      <small style={{ color: '#888' }}>{p.abordagem || 'Não especificada'}</small>
                    </td>
                    <td>{p.telefone || p.email || 'Não informado'}</td>
                    <td>
                      <Badge tone={p.status === 'Ativo' ? 'success' : 'warning'}>{p.status}</Badge>
                    </td>
                    <td>
                      {isAdmin ? (
                        <>
                          <button className="secondary-button" onClick={() => startEdit(p)}>
                            Editar
                          </button>{' '}
                          <button className="icon-button" title="Excluir" onClick={() => remove(p.id)}>
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <small style={{ color: '#64748b', fontWeight: 600 }}>Somente visualização</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty">Nenhum psicólogo cadastrado. Clique em “Novo psicólogo” para cadastrar.</div>
            )}
          </div>
        )}
      </section>

      {open && (
        <Modal title={editing ? 'Editar psicólogo' : 'Cadastrar novo psicólogo'} close={() => setOpen(false)}>
          <form className="modal-form" onSubmit={save}>
            <label className="field-label">
              Nome completo
              <input
                className="plain-input"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                minLength={2}
                placeholder="Ex: Dra. Juliana Fernandes"
              />
            </label>
            <div className="form-grid">
              <label className="field-label">
                Número do CRP
                <input
                  className="plain-input"
                  value={form.crp}
                  onChange={(e) => setForm({ ...form, crp: e.target.value })}
                  required
                  placeholder="Ex: 06/123456"
                />
              </label>
              <label className="field-label">
                Status
                <select
                  className="plain-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Ativo</option>
                  <option>Inativo</option>
                  <option>Licença</option>
                </select>
              </label>
            </div>
            <div className="form-grid">
              <label className="field-label">
                Especialidade principal
                <input
                  className="plain-input"
                  value={form.especialidade}
                  onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                  placeholder="Ex: TCC, Psicanálise, Infantil"
                />
              </label>
              <label className="field-label">
                Abordagem teórica
                <input
                  className="plain-input"
                  value={form.abordagem}
                  onChange={(e) => setForm({ ...form, abordagem: e.target.value })}
                  placeholder="Ex: Fenomenológica, Humanista"
                />
              </label>
            </div>
            <div className="form-grid">
              <label className="field-label">
                E-mail profissional (acesso do psicólogo)
                <input
                  className="plain-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ex: psicologo@clinicapsico.com.br"
                  required
                />
              </label>
              <label className="field-label">
                Telefone de contato
                <input
                  className="plain-input"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </label>
            </div>
            {!editing && (
              <div className="form-grid">
                <label className="field-label">
                  Senha inicial de acesso à plataforma
                  <input
                    className="plain-input"
                    type="password"
                    value={form.senha || ''}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres (padrão: Psi@123456)"
                  />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, color: '#244368', background: '#e8f1fa', padding: '10px 12px', borderRadius: 8, border: '1px solid #c2d9ee', marginTop: 18 }}>
                  <span>ℹ️ O psicólogo utilizará este e-mail e senha para acessar o painel clínico.</span>
                </div>
              </div>
            )}
            {error && <div className="alert-error">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="primary-button">{editing ? 'Salvar alterações' : 'Cadastrar profissional'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
