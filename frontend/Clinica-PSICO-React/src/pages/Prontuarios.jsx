import React, { useEffect, useState } from 'react';
import { ClipboardList, Plus, Search, ShieldCheck, Lock, Eye, EyeOff, X, FileText, Calendar } from 'lucide-react';
import { Heading, Badge } from '../components/UI';
import Modal from '../components/Modal';
import { listarProntuarios, criarProntuario, atualizarProntuario, excluirProntuario, listarPacientes, listarPsicologos } from '../services/api';

const hojeISO = () => new Date().toISOString().split('T')[0];

export default function ProntuariosPage() {
  const emptyForm = {
    paciente_id: '',
    psicologo_id: '',
    data: hojeISO(),
    tipo: 'Evolução de sessão',
    evolucao: '',
    conduta: '',
    confidencial: true
  };

  const [prontuarios, setProntuarios] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [psicologos, setPsicologos] = useState([]);
  const [filtroPaciente, setFiltroPaciente] = useState('');
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
      const [prs, pats, psis] = await Promise.all([
        listarProntuarios(filtroPaciente ? Number(filtroPaciente) : null),
        listarPacientes(),
        listarPsicologos()
      ]);
      setProntuarios(prs);
      setPacientes(pats);
      setPsicologos(psis);
    } catch (e) {
      setError(e.message || 'Erro ao carregar prontuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filtroPaciente]);

  function startNew() {
    setEditing(null);
    setForm({
      ...emptyForm,
      paciente_id: filtroPaciente || (pacientes[0]?.id ? String(pacientes[0].id) : ''),
      psicologo_id: psicologos[0]?.id ? String(psicologos[0].id) : ''
    });
    setError('');
    setOpen(true);
  }

  function startEdit(pr) {
    setEditing(pr);
    setForm({
      paciente_id: String(pr.paciente_id),
      psicologo_id: pr.psicologo_id ? String(pr.psicologo_id) : '',
      data: String(pr.data),
      tipo: pr.tipo,
      evolucao: pr.evolucao || '',
      conduta: pr.conduta || '',
      confidencial: pr.confidencial ?? true
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
        await atualizarProntuario(editing.id, payload);
        setNotice('Evolução clínica atualizada com sucesso.');
      } else {
        await criarProntuario(payload);
        setNotice('Evolução registrada e criptografada com sucesso no prontuário.');
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.message || 'Erro ao salvar prontuário.');
    }
  }

  async function remove(id) {
    if (!window.confirm('Excluir este registro clínico? Esta ação é irreversível.')) return;
    try {
      await excluirProntuario(id);
      setNotice('Registro excluído.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-content">
      <Heading
        title="Prontuários & Evolução Clínica"
        subtitle="Registro longitudinal do processo psicoterápico com criptografia AES-256 e controle de acesso restrito."
        action="Nova evolução clínica"
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

      <div style={{ display: 'flex', gap: 12, marginBottom: 15, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#556' }}>Filtrar por paciente:</span>
        <select
          className="plain-input"
          style={{ width: 280 }}
          value={filtroPaciente}
          onChange={(e) => setFiltroPaciente(e.target.value)}
        >
          <option value="">Todos os pacientes ({pacientes.length})</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} (Prontuário #{p.id})
            </option>
          ))}
        </select>
      </div>

      <div className="notice" style={{ marginBottom: 18 }}>
        <ShieldCheck size={16} />
        <span>
          <b>Sigilo Profissional:</b> Conforme o Código de Ética Profissional do Psicólogo (CFP) e a LGPD, o acesso aos prontuários
          é auditado a cada visualização.
        </span>
      </div>

      {loading ? (
        <div className="empty">Carregando prontuários...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {prontuarios.map((pr) => (
            <section className="panel" key={pr.id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClipboardList size={17} color="#2e7865" />
                    {pr.paciente_nome} — <small style={{ fontWeight: 600 }}>{pr.tipo}</small>
                  </h3>
                  <small style={{ color: '#889' }}>
                    Data do registro: <b>{pr.data}</b> • Profissional: <b>{pr.psicologo_nome}</b>
                  </small>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {pr.confidencial && (
                    <span className="confidential-tag">
                      <Lock size={11} /> Confidencial (Criptografado)
                    </span>
                  )}
                  <button className="secondary-button" onClick={() => startEdit(pr)}>
                    Editar
                  </button>
                  <button className="icon-button" title="Excluir" onClick={() => remove(pr.id)}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ background: '#f8faf9', padding: 14, borderRadius: 8, border: '1px solid #edf2ee', marginBottom: 8 }}>
                <b style={{ fontSize: 11, color: '#385043', display: 'block', marginBottom: 6 }}>
                  Evolução Clínica / Síntese da Sessão:
                </b>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#27382f', whiteSpace: 'pre-wrap' }}>
                  {pr.evolucao || 'Nenhum detalhe informado.'}
                </p>
              </div>

              {pr.conduta && (
                <div style={{ padding: '8px 14px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #dcfce7' }}>
                  <b style={{ fontSize: 11, color: '#166534', display: 'block', marginBottom: 4 }}>
                    Conduta & Próximos Passos Terapêuticos:
                  </b>
                  <p style={{ margin: 0, fontSize: 11, color: '#14532d', lineHeight: 1.5 }}>{pr.conduta}</p>
                </div>
              )}
            </section>
          ))}

          {prontuarios.length === 0 && (
            <div className="empty">Nenhum prontuário registrado para os filtros selecionados.</div>
          )}
        </div>
      )}

      {open && (
        <Modal title={editing ? 'Editar evolução clínica' : 'Novo registro no prontuário'} close={() => setOpen(false)}>
          <form className="modal-form" onSubmit={save}>
            <label className="field-label">
              Paciente
              <select
                className="plain-input"
                value={form.paciente_id}
                onChange={(e) => setForm({ ...form, paciente_id: e.target.value })}
                required
              >
                <option value="">Selecione o paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (Prontuário #{p.id})
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label className="field-label">
                Data do registro
                <input
                  className="plain-input"
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  required
                />
              </label>
              <label className="field-label">
                Psicólogo(a) responsável
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
            </div>

            <label className="field-label">
              Tipo de anotação clínica
              <select
                className="plain-input"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option>Evolução de sessão</option>
                <option>Entrevista inicial / Anamnese</option>
                <option>Plano terapêutico</option>
                <option>Observação comportamental</option>
                <option>Devolutiva de avaliação</option>
              </select>
            </label>

            <label className="field-label">
              Evolução e síntese clínica (Criptografada no banco)
              <textarea
                className="plain-input"
                rows="5"
                placeholder="Descreva o conteúdo da sessão, demandas trabalhadas, queixas e reações emocionais..."
                value={form.evolucao}
                onChange={(e) => setForm({ ...form, evolucao: e.target.value })}
                required
              />
            </label>

            <label className="field-label">
              Conduta e encaminhamentos
              <textarea
                className="plain-input"
                rows="2"
                placeholder="Próximas intervenções, tarefas de casa ou orientações..."
                value={form.conduta}
                onChange={(e) => setForm({ ...form, conduta: e.target.value })}
              />
            </label>

            {error && <div className="alert-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="primary-button">{editing ? 'Atualizar registro' : 'Salvar no prontuário'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
