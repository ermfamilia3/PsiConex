import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, Search, Video, X, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Heading, Badge } from '../components/UI';
import Modal from '../components/Modal';
import { listarAgenda, criarAgendamento, atualizarAgendamento, excluirAgendamento, listarPacientes, listarPsicologos } from '../services/api';

const hojeISO = () => new Date().toISOString().split('T')[0];

export default function AgendaPage({ onEntrarVideo }) {
  const emptyForm = {
    paciente_id: '',
    psicologo_id: '',
    data: hojeISO(),
    hora_inicio: '14:00',
    hora_fim: '14:50',
    tipo: 'Psicoterapia individual',
    modalidade: 'Presencial',
    status: 'Aguardando',
    observacoes: ''
  };

  const [agendamentos, setAgendamentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [psicologos, setPsicologos] = useState([]);
  const [viewMode, setViewMode] = useState('calendario'); // 'calendario' | 'lista'
  const [dataFiltro, setDataFiltro] = useState(hojeISO());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Para navegação mensal no calendário
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [ags, pats, psis] = await Promise.all([
        listarAgenda(),
        listarPacientes(),
        listarPsicologos()
      ]);
      setAgendamentos(ags);
      setPacientes(pats);
      setPsicologos(psis);
    } catch (e) {
      setError(e.message || 'Erro ao carregar dados da agenda.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startNew(dataPrevia = null) {
    setEditing(null);
    setForm({
      ...emptyForm,
      data: dataPrevia || hojeISO(),
      paciente_id: pacientes[0]?.id ? String(pacientes[0].id) : '',
      psicologo_id: psicologos[0]?.id ? String(psicologos[0].id) : ''
    });
    setError('');
    setOpen(true);
  }

  function startEdit(ag) {
    setEditing(ag);
    setForm({
      paciente_id: String(ag.paciente_id),
      psicologo_id: ag.psicologo_id ? String(ag.psicologo_id) : '',
      data: String(ag.data),
      hora_inicio: ag.hora_inicio,
      hora_fim: ag.hora_fim || '',
      tipo: ag.tipo,
      modalidade: ag.modalidade,
      status: ag.status,
      observacoes: ag.observacoes || ''
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
        await atualizarAgendamento(editing.id, payload);
        setNotice('Agendamento atualizado com sucesso.');
      } else {
        await criarAgendamento(payload);
        setNotice('Agendamento criado! Link de sala online gerado se aplicável.');
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.message || 'Erro ao salvar agendamento.');
    }
  }

  async function alterarStatus(ag, novoStatus) {
    try {
      await atualizarAgendamento(ag.id, { ...ag, status: novoStatus });
      setNotice(`Atendimento marcado como ${novoStatus}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Deseja excluir este agendamento?')) return;
    try {
      await excluirAgendamento(id);
      setNotice('Agendamento excluído.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  // Gera dias para a grade do calendário mensal
  function getDiasDoMes(ano, mes) {
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const dias = [];
    for (let i = 0; i < primeiroDia; i++) dias.push(null);
    for (let d = 1; d <= totalDias; d++) dias.push(d);
    return dias;
  }

  const nomeMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  function proximoMes() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  function mesAnterior() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  return (
    <div className="page-content">
      <Heading
        title="Agenda & Atendimentos"
        subtitle="Calendário interativo, gerenciamento de horários e geração de salas Jitsi Meet."
        action="Novo agendamento"
        onAction={() => startNew()}
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

      <div className="tabs-bar">
        <button
          className={`tab-btn ${viewMode === 'calendario' ? 'active' : ''}`}
          onClick={() => setViewMode('calendario')}
        >
          Visualização em Calendário Mensal
        </button>
        <button
          className={`tab-btn ${viewMode === 'lista' ? 'active' : ''}`}
          onClick={() => setViewMode('lista')}
        >
          Lista de Agendamentos ({agendamentos.length})
        </button>
      </div>

      {viewMode === 'calendario' ? (
        <section className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              {nomeMeses[currentMonth]} de {currentYear}
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="secondary-button" onClick={mesAnterior}>
                <ChevronLeft size={16} /> Mês anterior
              </button>
              <button className="secondary-button" onClick={() => { setCurrentMonth(new Date().getMonth()); setCurrentYear(new Date().getFullYear()); }}>
                Hoje
              </button>
              <button className="secondary-button" onClick={proximoMes}>
                Próximo mês <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <div key={dia} className="calendar-day-header">
                {dia}
              </div>
            ))}

            {getDiasDoMes(currentYear, currentMonth).map((dia, idx) => {
              if (dia === null) {
                return <div key={`empty-${idx}`} style={{ minHeight: 80, background: '#fafbfc', borderRadius: 8 }} />;
              }
              const dataStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
              const agsDoDia = agendamentos.filter((a) => String(a.data) === dataStr);
              const isToday = dataStr === hojeISO();

              return (
                <div key={dataStr} className={`calendar-day-cell ${isToday ? 'today' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="calendar-day-number">{dia}</span>
                    <button
                      className="icon-button"
                      style={{ width: 18, height: 18 }}
                      title="Agendar neste dia"
                      onClick={() => startNew(dataStr)}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  {agsDoDia.map((ag) => (
                    <div
                      key={ag.id}
                      className={`calendar-event-pill ${ag.modalidade === 'On-line' ? 'online' : ''} ${ag.status === 'Cancelado' ? 'cancelado' : ''}`}
                      title={`${ag.hora_inicio} - ${ag.paciente_nome} (${ag.modalidade})`}
                      onClick={() => startEdit(ag)}
                    >
                      <b>{ag.hora_inicio}</b> {ag.paciente_nome}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="panel table-panel">
          <div className="table-toolbar">
            <div>
              <h3>Lista Geral de Consultas</h3>
              <p>{agendamentos.length} agendamento(s) registrados</p>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data & Hora</th>
                  <th>Paciente</th>
                  <th>Psicólogo</th>
                  <th>Modalidade</th>
                  <th>Status</th>
                  <th>Ações & Vídeo</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((ag) => (
                  <tr key={ag.id}>
                    <td>
                      <b>{ag.data}</b> às {ag.hora_inicio}
                    </td>
                    <td>
                      <b>{ag.paciente_nome}</b>
                    </td>
                    <td>{ag.psicologo_nome || 'Não atribuído'}</td>
                    <td>
                      {ag.modalidade === 'On-line' ? (
                        <span style={{ color: '#0369a1', fontWeight: 600 }}>📹 On-line</span>
                      ) : (
                        <span>🏢 Presencial</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={ag.status === 'Confirmado' ? 'success' : ag.status === 'Realizado' ? 'mint' : 'warning'}>
                        {ag.status}
                      </Badge>
                    </td>
                    <td>
                      {ag.modalidade === 'On-line' && ag.link_sala && (
                        <button
                          className="secondary-button"
                          style={{ marginRight: 6, color: '#0369a1', borderColor: '#bae6fd', background: '#f0f9ff' }}
                          onClick={() => onEntrarVideo(ag)}
                          title="Abrir sala Jitsi Meet integrada"
                        >
                          <Video size={13} style={{ marginRight: 4 }} /> Entrar na Sala
                        </button>
                      )}
                      <button className="secondary-button" onClick={() => startEdit(ag)}>
                        Editar
                      </button>{' '}
                      <button className="icon-button" title="Excluir" onClick={() => remove(ag.id)}>
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {agendamentos.length === 0 && (
              <div className="empty">Nenhum atendimento agendado. Clique em “Novo agendamento” para começar.</div>
            )}
          </div>
        </section>
      )}

      {open && (
        <Modal title={editing ? 'Editar agendamento' : 'Novo agendamento'} close={() => setOpen(false)}>
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
                    {p.nome} ({p.modalidade})
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Psicólogo(a) responsável
              <select
                className="plain-input"
                value={form.psicologo_id}
                onChange={(e) => setForm({ ...form, psicologo_id: e.target.value })}
              >
                <option value="">Selecione o profissional (opcional)...</option>
                {psicologos.map((psi) => (
                  <option key={psi.id} value={psi.id}>
                    {psi.nome} — CRP {psi.crp}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label className="field-label">
                Data do atendimento
                <input
                  className="plain-input"
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  required
                />
              </label>
              <label className="field-label">
                Horário de início
                <input
                  className="plain-input"
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="form-grid">
              <label className="field-label">
                Modalidade
                <select
                  className="plain-input"
                  value={form.modalidade}
                  onChange={(e) => setForm({ ...form, modalidade: e.target.value })}
                >
                  <option>Presencial</option>
                  <option>On-line</option>
                </select>
              </label>
              <label className="field-label">
                Status
                <select
                  className="plain-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Aguardando</option>
                  <option>Confirmado</option>
                  <option>Realizado</option>
                  <option>Cancelado</option>
                </select>
              </label>
            </div>

            <label className="field-label">
              Tipo de atendimento
              <select
                className="plain-input"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option>Psicoterapia individual</option>
                <option>Entrevista inicial / Anamnese</option>
                <option>Devolutiva</option>
                <option>Acompanhamento</option>
                <option>Orientação familiar</option>
              </select>
            </label>

            <label className="field-label">
              Observações ou pauta da sessão
              <textarea
                className="plain-input"
                rows="2"
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </label>

            {form.modalidade === 'On-line' && (
              <div className="notice" style={{ marginTop: 10 }}>
                <Video size={16} />
                <span>Uma sala privada do <b>Jitsi Meet</b> será gerada automaticamente e vinculada a este agendamento.</span>
              </div>
            )}

            {error && <div className="alert-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="primary-button">{editing ? 'Salvar alterações' : 'Confirmar agendamento'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
