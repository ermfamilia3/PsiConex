import React, { useState, useEffect } from 'react';
import { Video, Copy, ExternalLink, RefreshCw, Calendar, Check, ShieldCheck } from 'lucide-react';
import { Heading, Badge } from '../components/UI';
import { listarAgenda } from '../services/api';

export default function AtendimentoOnlinePage({ agendamentoAtivo }) {
  const [agendamentosOnline, setAgendamentosOnline] = useState([]);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(agendamentoAtivo || null);
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    try {
      const ags = await listarAgenda();
      const onlineAgs = ags.filter(
        (a) => a.modalidade === 'On-line' || a.modalidade === 'Híbrido'
      );
      setAgendamentosOnline(onlineAgs);
      if (!agendamentoSelecionado && onlineAgs.length > 0) {
        setAgendamentoSelecionado(onlineAgs[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (agendamentoAtivo) {
      setAgendamentoSelecionado(agendamentoAtivo);
    }
  }, [agendamentoAtivo]);

  const linkSala =
    agendamentoSelecionado?.link_sala ||
    'https://meet.jit.si/ClinicaPSICO_SalaGeralAtendimento';

  function copiarLink() {
    navigator.clipboard.writeText(linkSala);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div className="page-content">
      <Heading
        title="Atendimento On-line — Videochamada Integrada"
        subtitle="Sessões de telepsicologia com criptografia ponta a ponta via Jitsi Meet, sem sair do sistema."
      />

      <div className="dashboard-columns" style={{ gridTemplateColumns: '1fr 340px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <section className="panel" style={{ padding: 18, marginBottom: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Video size={18} color="#0284c7" />
                  Sala: {agendamentoSelecionado ? `${agendamentoSelecionado.paciente_nome} — ${agendamentoSelecionado.hora_inicio}` : 'Sala Clínica PSICO'}
                </h3>
                <small style={{ color: '#64748b' }}>
                  {linkSala}
                </small>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="secondary-button"
                  onClick={copiarLink}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {copiado ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  {copiado ? 'Link Copiado!' : 'Copiar Link para o Paciente'}
                </button>
                <a
                  href={linkSala}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <ExternalLink size={14} /> Abrir em Nova Aba
                </a>
              </div>
            </div>

            {/* Iframe Jitsi Meet Embed */}
            <div className="video-frame-container">
              <iframe
                title="Sala Jitsi Meet Clínica PSICO"
                src={`${linkSala}#config.prejoinConfig.enabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="video-frame"
              />
            </div>

            <div className="notice" style={{ marginTop: 10 }}>
              <ShieldCheck size={16} />
              <span>
                <b>Telepsicologia Segura:</b> A conexão WebRTC é criptografada. O paciente pode entrar pelo computador ou celular
                sem necessidade de instalar nenhum aplicativo.
              </span>
            </div>
          </section>
        </div>

        <div>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Consultas On-line</h3>
                <p>Selecione para entrar na sala do paciente</p>
              </div>
              <button className="icon-button" onClick={carregar} title="Atualizar">
                <RefreshCw size={15} />
              </button>
            </div>

            {agendamentosOnline.length === 0 ? (
              <div className="empty">Nenhum atendimento on-line cadastrado na agenda.</div>
            ) : (
              agendamentosOnline.map((a) => {
                const isSelected = agendamentoSelecionado?.id === a.id;
                return (
                  <div
                    key={a.id}
                    className="appointment"
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? '#f0f9ff' : 'transparent',
                      border: isSelected ? '1px solid #bae6fd' : '1px solid transparent',
                      borderRadius: 8,
                      padding: 10
                    }}
                    onClick={() => setAgendamentoSelecionado(a)}
                  >
                    <b className="appointment-time">{a.hora_inicio}</b>
                    <div className="appointment-person">
                      <b>{a.paciente_nome}</b>
                      <small>{a.data} • {a.tipo}</small>
                    </div>
                    <Badge tone={a.status === 'Confirmado' ? 'success' : 'neutral'}>
                      {a.status}
                    </Badge>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
