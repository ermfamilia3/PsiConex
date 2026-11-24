import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Plus, Search, X, Check, FileCheck } from 'lucide-react';
import { Heading, Badge } from '../components/UI';
import Modal from '../components/Modal';
import { listarTestes, criarTeste, atualizarTeste, excluirTeste, listarPacientes, listarPsicologos } from '../services/api';

const hojeISO = () => new Date().toISOString().split('T')[0];

export default function TestesPage() {
  const emptyForm = {
    paciente_id: '',
    psicologo_id: '',
    instrumento: '',
    data_aplicacao: hojeISO(),
    status: 'Aplicado',
    resultado: '',
    observacoes: ''
  };

  const [testes, setTestes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [psicologos, setPsicologos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [ts, pats, psis] = await Promise.all([
        listarTestes(),
        listarPacientes(),
        listarPsicologos()
      ]);
      setTestes(ts);
      setPacientes(pats);
      setPsicologos(psis);
    } catch (e) {
      setError(e.message || 'Erro ao carregar testes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setEditing(null);
    setForm({
      ...emptyForm,
      paciente_id: pacientes[0]?.id ? String(pacientes[0].id) : '',
      psicologo_id: psicologos[0]?.id ? String(psicologos[0].id) : ''
    });
    setError('');
    setOpen(true);
  }

  function startEdit(t) {
    setEditing(t);
    setForm({
      paciente_id: String(t.paciente_id),
      psicologo_id: t.psicologo_id ? String(t.psicologo_id) : '',
      instrumento: t.instrumento,
      data_aplicacao: String(t.data_aplicacao),
      status: t.status,
      resultado: t.resultado || '',
      observacoes: t.observacoes || ''
    });
    setError('');
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        paciente_id: Number(form.paciente_id),
        psicologo_id: form.psicologo_id ? Number(form.psicologo_id) : null
      };
      if (editing) {
        await atualizarTeste(editing.id, payload);
        setNotice('Registro de teste atualizado.');
      } else {
        await criarTeste(payload);
        setNotice('Aplicação de instrumento registrada.');
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.message || 'Erro ao salvar teste.');
    }
  }

  async function remove(id) {
    if (!window.confirm('Excluir este registro de teste?')) return;
    try {
      await excluirTeste(id);
      setNotice('Registro excluído.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-content">
      <Heading
        title="Controle de Testes & Instrumentos Psicológicos"
        subtitle="Rastreamento de avaliações, aplicação de instrumentos autorizados pelo SATEPSI e status de correção."
        action="Registrar instrumento"
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

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3>Aplicações Registradas</h3>
            <p>{testes.length} teste(s) registrados</p>
          </div>
        </div>

        {loading ? (
          <div className="empty">Carregando testes...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Instrumento</th>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Data de Aplicação</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {testes.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.instrumento}</b>
                    </td>
                    <td>{t.paciente_nome}</td>
                    <td>{t.psicologo_nome || 'Não atribuído'}</td>
                    <td>{t.data_aplicacao}</td>
                    <td>
                      <Badge tone={t.status === 'Corrigido' ? 'success' : t.status === 'Em correção' ? 'peach' : 'warning'}>
                        {t.status}
                      </Badge>
                    </td>
                    <td>
                      <button className="secondary-button" onClick={() => startEdit(t)}>
                        Editar / Resultado
                      </button>{' '}
                      <button className="icon-button" title="Excluir" onClick={() => remove(t.id)}>
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {testes.length === 0 && (
              <div className="empty">Nenhum teste psicológico registrado. Clique em “Registrar instrumento” para adicionar.</div>
            )}
          </div>
        )}
      </section>

      {open && (
        <Modal title={editing ? 'Editar aplicação de teste' : 'Registrar nova aplicação de teste'} close={() => setOpen(false)}>
          <form className="modal-form" onSubmit={save}>
            <label className="field-label">
              Paciente avaliado
              <select
                className="plain-input"
                value={form.paciente_id}
                onChange={(e) => setForm({ ...form, paciente_id: e.target.value })}
                required
              >
                <option value="">Selecione o paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label className="field-label">
                Nome do instrumento / teste
                <input
                  className="plain-input"
                  value={form.instrumento}
                  onChange={(e) => setForm({ ...form, instrumento: e.target.value })}
                  placeholder="Ex: BFP, BDI-II, WASI, HTP"
                  required
                />
              </label>
              <label className="field-label">
                Data da aplicação
                <input
                  className="plain-input"
                  type="date"
                  value={form.data_aplicacao}
                  onChange={(e) => setForm({ ...form, data_aplicacao: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="form-grid">
              <label className="field-label">
                Psicólogo aplicador
                <select
                  className="plain-input"
                  value={form.psicologo_id}
                  onChange={(e) => setForm({ ...form, psicologo_id: e.target.value })}
                >
                  <option value="">Não atribuído</option>
                  {psicologos.map((psi) => (
                    <option key={psi.id} value={psi.id}>
                      {psi.nome} (CRP {psi.crp})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Status da correção
                <select
                  className="plain-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Aplicado</option>
                  <option>Em correção</option>
                  <option>Corrigido</option>
                </select>
              </label>
            </div>

            <label className="field-label">
              Síntese do resultado e escores
              <textarea
                className="plain-input"
                rows="3"
                value={form.resultado}
                onChange={(e) => setForm({ ...form, resultado: e.target.value })}
                placeholder="Percentis, classificações normativas ou pontuações brutas..."
              />
            </label>

            <label className="field-label">
              Observações qualitativas
              <textarea
                className="plain-input"
                rows="2"
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Comportamento durante a testagem, cooperação, tempo..."
              />
            </label>

            {error && <div className="alert-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="primary-button">{editing ? 'Salvar alterações' : 'Registrar teste'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
