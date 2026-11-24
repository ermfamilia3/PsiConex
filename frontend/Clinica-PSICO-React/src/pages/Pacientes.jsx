import React, { useEffect, useState } from 'react';
import { Search, Plus, X, ShieldCheck } from 'lucide-react';
import { Heading, Badge } from '../components/UI';
import Modal from '../components/Modal';
import { listarPacientes, criarPaciente, atualizarPaciente, excluirPaciente } from '../services/api';

const initials = (name = 'Paciente') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();

export default function PatientsPage() {
  const emptyForm = {
    nome: '',
    data_nascimento: '',
    cpf: '',
    email: '',
    telefone: '',
    endereco: '',
    responsavel: '',
    contato_emergencia: '',
    telefone_emergencia: '',
    modalidade: 'Presencial',
    status: 'Ativo',
    observacoes: '',
    consentimento_lgpd: true
  };

  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setPatients(await listarPacientes());
    } catch (e) {
      setError(e.message || 'Não foi possível carregar os pacientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = patients.filter((p) =>
    `${p.nome} ${p.cpf || ''} ${p.telefone || ''} ${p.email || ''}`
      .toLowerCase()
      .includes(query.toLowerCase())
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
      const payload = {
        ...form,
        cpf: form.cpf || null,
        email: form.email || null,
        data_nascimento: form.data_nascimento || null,
        telefone: form.telefone || null,
        endereco: form.endereco || null,
        responsavel: form.responsavel || null,
        contato_emergencia: form.contato_emergencia || null,
        telefone_emergencia: form.telefone_emergencia || null,
        observacoes: form.observacoes || null
      };
      if (editing) {
        await atualizarPaciente(editing.id, payload);
      } else {
        await criarPaciente(payload);
      }
      setOpen(false);
      setNotice(editing ? 'Dados do paciente atualizados com sucesso.' : 'Paciente cadastrado com sucesso.');
      await load();
    } catch (e) {
      setError(e.message || 'Não foi possível salvar o paciente.');
    }
  }

  async function removePatient(p) {
    if (!window.confirm(`Excluir o cadastro de ${p.nome}? Esta ação removerá prontuários e agendamentos vinculados.`))
      return;
    try {
      await excluirPaciente(p.id);
      setNotice('Paciente excluído com sucesso.');
      if (selected?.id === p.id) setSelected(null);
      await load();
    } catch (e) {
      setError(e.message || 'Não foi possível excluir o paciente.');
    }
  }

  return (
    <div className="page-content">
      <Heading
        title="Gestão de Pacientes"
        subtitle="Cadastros organizados, com validação de CPF e conformidade LGPD."
        action="Novo paciente"
        onAction={startNew}
      />

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
          <span>Total de cadastros</span>
          <b>{patients.length}</b>
        </div>
        <div>
          <span>Pacientes ativos</span>
          <b>{patients.filter((p) => p.status === 'Ativo').length}</b>
        </div>
        <div>
          <span>Atendimento on-line / híbrido</span>
          <b>{patients.filter((p) => ['On-line', 'Híbrido'].includes(p.modalidade)).length}</b>
        </div>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3>Lista de Pacientes</h3>
            <p>{loading ? 'Conectando à API...' : `${patients.length} paciente(s) encontrados`}</p>
          </div>
          <label className="table-search">
            <Search size={15} />
            <input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {loading ? (
          <div className="empty">Carregando pacientes da API...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Contato</th>
                  <th>Modalidade</th>
                  <th>CPF</th>
                  <th>LGPD</th>
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
                          <small>Prontuário #{p.id}</small>
                        </span>
                      </div>
                    </td>
                    <td>{p.telefone || p.email || 'Não informado'}</td>
                    <td>{p.modalidade}</td>
                    <td>{p.cpf || '—'}</td>
                    <td>
                      {p.consentimento_lgpd ? (
                        <span style={{ color: '#2e7865', fontSize: '10px', fontWeight: 'bold' }}>✓ Coletado</span>
                      ) : (
                        <span style={{ color: '#b45309', fontSize: '10px' }}>Pendente</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={p.status === 'Ativo' ? 'success' : 'warning'}>{p.status}</Badge>
                    </td>
                    <td>
                      <button className="secondary-button" onClick={() => setSelected(p)}>
                        Ver
                      </button>{' '}
                      <button className="secondary-button" onClick={() => startEdit(p)}>
                        Editar
                      </button>{' '}
                      <button className="icon-button" title="Excluir" onClick={() => removePatient(p)}>
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty">Nenhum paciente encontrado. Clique em “Novo paciente” para começar.</div>
            )}
          </div>
        )}
      </section>

      {selected && (
        <Modal title={`Paciente · ${selected.nome}`} close={() => setSelected(null)}>
          <div className="patient-profile">
            <div className="patient-profile-grid">
              <p>
                <b>Data de nascimento</b>
                <span>{selected.data_nascimento || 'Não informado'}</span>
              </p>
              <p>
                <b>CPF</b>
                <span>{selected.cpf || 'Não informado'}</span>
              </p>
              <p>
                <b>E-mail</b>
                <span>{selected.email || 'Não informado'}</span>
              </p>
              <p>
                <b>Telefone</b>
                <span>{selected.telefone || 'Não informado'}</span>
              </p>
              <p>
                <b>Modalidade</b>
                <span>{selected.modalidade}</span>
              </p>
              <p>
                <b>Status</b>
                <span>{selected.status}</span>
              </p>
              <p>
                <b>Endereço</b>
                <span>{selected.endereco || 'Não informado'}</span>
              </p>
              <p>
                <b>Responsável legal</b>
                <span>{selected.responsavel || 'Não informado'}</span>
              </p>
              <p>
                <b>Contato de emergência</b>
                <span>{selected.contato_emergencia || 'Não informado'}</span>
              </p>
              <p>
                <b>Telefone de emergência</b>
                <span>{selected.telefone_emergencia || 'Não informado'}</span>
              </p>
            </div>
            {selected.observacoes && (
              <div className="patient-notes">
                <b>Observações administrativas</b>
                <p>{selected.observacoes}</p>
              </div>
            )}
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setSelected(null);
                  startEdit(selected);
                }}
              >
                Editar cadastro
              </button>
              <button className="primary-button" onClick={() => setSelected(null)}>
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {open && (
        <Modal title={editing ? 'Editar paciente' : 'Novo paciente'} close={() => setOpen(false)}>
          <form className="modal-form patient-form" onSubmit={save}>
            <label className="field-label">
              Nome completo
              <input
                className="plain-input"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                minLength={2}
              />
            </label>
            <div className="form-grid">
              <label className="field-label">
                Data de nascimento
                <input
                  className="plain-input"
                  type="date"
                  value={form.data_nascimento || ''}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                />
              </label>
              <label className="field-label">
                CPF
                <input
                  className="plain-input"
                  value={form.cpf || ''}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  maxLength="14"
                  placeholder="000.000.000-00"
                />
              </label>
            </div>
            <div className="form-grid">
              <label className="field-label">
                E-mail
                <input
                  className="plain-input"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="paciente@email.com"
                />
              </label>
              <label className="field-label">
                Telefone / WhatsApp
                <input
                  className="plain-input"
                  value={form.telefone || ''}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </label>
            </div>
            <label className="field-label">
              Endereço residencial
              <input
                className="plain-input"
                value={form.endereco || ''}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade"
              />
            </label>
            <div className="form-grid">
              <label className="field-label">
                Responsável legal (para menores)
                <input
                  className="plain-input"
                  value={form.responsavel || ''}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                />
              </label>
              <label className="field-label">
                Contato de emergência
                <input
                  className="plain-input"
                  value={form.contato_emergencia || ''}
                  onChange={(e) => setForm({ ...form, contato_emergencia: e.target.value })}
                />
              </label>
            </div>
            <div className="form-grid">
              <label className="field-label">
                Telefone de emergência
                <input
                  className="plain-input"
                  value={form.telefone_emergencia || ''}
                  onChange={(e) => setForm({ ...form, telefone_emergencia: e.target.value })}
                />
              </label>
              <label className="field-label">
                Modalidade de atendimento
                <select
                  className="plain-input"
                  value={form.modalidade}
                  onChange={(e) => setForm({ ...form, modalidade: e.target.value })}
                >
                  <option>Presencial</option>
                  <option>On-line</option>
                  <option>Híbrido</option>
                </select>
              </label>
            </div>
            <label className="field-label">
              Status do paciente
              <select
                className="plain-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Ativo</option>
                <option>Inativo</option>
                <option>Em espera</option>
                <option>Alta</option>
              </select>
            </label>
            <label className="field-label">
              Observações administrativas
              <textarea
                className="plain-input"
                rows="3"
                value={form.observacoes || ''}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </label>
            <label className="check-label" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.consentimento_lgpd}
                onChange={(e) => setForm({ ...form, consentimento_lgpd: e.target.checked })}
              />
              <span style={{ fontSize: '11px', color: '#444' }}>
                Paciente assinou ou confirmou o <b>Termo de Consentimento e Tratamento de Dados (LGPD)</b>
              </span>
            </label>
            {error && <div className="alert-error">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="primary-button">{editing ? 'Salvar alterações' : 'Cadastrar paciente'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
