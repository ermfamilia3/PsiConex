import React, { useEffect, useState } from 'react';
import {
  Users,
  CalendarDays,
  Clock3,
  Wallet,
  ArrowRight,
  Sparkles,
  Flower2,
  Video,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Stat, Badge } from '../components/UI';
import { obterResumoRelatorios, listarAgenda } from '../services/api';

const money = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const today = () =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

const initials = (name = 'Profissional') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();

export default function Dashboard({ user, go }) {
  const [resumo, setResumo] = useState(null);
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const hojeISO = new Date().toISOString().split('T')[0];
        const [r, ags] = await Promise.all([
          obterResumoRelatorios(),
          listarAgenda({ data_inicio: hojeISO, data_fim: hojeISO })
        ]);
        setResumo(r);
        setAgendamentosHoje(ags);
      } catch (err) {
        console.error('Erro ao carregar dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  return (
    <div className="page-content">
      <div className="welcome">
        <div>
          <span className="eyebrow light">SEU ESPAÇO PROFISSIONAL INTEGRADO</span>
          <h1>
            Olá, {user?.nome?.split(' ')[0] || 'profissional'} <span>✦</span>
          </h1>
          <p>Tudo o que você precisa para gerenciar sua clínica e focar no atendimento dos pacientes.</p>
          <small>
            <CalendarDays size={14} /> {today()}
          </small>
        </div>
        <div className="welcome-art">
          <div className="ring ring-a" />
          <div className="ring ring-b" />
          <img
            src="/logo-simbolo.png"
            alt="PsiConex"
            style={{
              width: 78,
              height: 78,
              borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.95)',
              padding: 8,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              zIndex: 2
            }}
          />
          <b>
            PsiConex
            <br />cuidar também é organizar.
          </b>
        </div>
      </div>

      <div className="section-title">
        <div>
          <h2>Visão Geral da Clínica</h2>
          <p>Indicadores atualizados em tempo real.</p>
        </div>
        <button className="secondary-button" onClick={() => go('agenda')}>
          Ver agenda completa <ArrowRight size={15} />
        </button>
      </div>

      <div className="stats-grid">
        <Stat
          icon={Users}
          label="Pacientes Ativos"
          value={String(resumo?.pacientes_ativos ?? 0).padStart(2, '0')}
          note={`De um total de ${resumo?.total_pacientes ?? 0} cadastrados`}
          tone="lavender"
        />
        <Stat
          icon={CalendarDays}
          label="Sessões Hoje"
          value={String(resumo?.agendamentos_hoje ?? 0).padStart(2, '0')}
          note="Agendados para hoje"
          tone="mint"
        />
        <Stat
          icon={Wallet}
          label="Receita do Mês"
          value={money(resumo?.total_receitas_mes ?? 0)}
          note={`Saldo líquido: ${money(resumo?.saldo_mes ?? 0)}`}
          tone="blue"
        />
        <Stat
          icon={FileText}
          label="Prontuários & Docs"
          value={String((resumo?.total_prontuarios ?? 0) + (resumo?.total_documentos ?? 0)).padStart(2, '0')}
          note="Registros clínicos seguros"
          tone="peach"
        />
      </div>

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Atendimentos de Hoje</h3>
              <p>Organize o seu dia com facilidade.</p>
            </div>
            <button className="icon-button" onClick={() => go('agenda')} title="Ir para agenda">
              <ArrowRight size={18} />
            </button>
          </div>

          {agendamentosHoje.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0' }}>
              Nenhum atendimento agendado para hoje.
            </div>
          ) : (
            agendamentosHoje.slice(0, 5).map((a, i) => (
              <div className="appointment" key={a.id}>
                <b className="appointment-time">{a.hora_inicio}</b>
                <div className={`person-avatar tone-${i % 4}`}>{initials(a.paciente_nome)}</div>
                <div className="appointment-person">
                  <b>{a.paciente_nome}</b>
                  <small>{a.tipo}</small>
                </div>
                <div className="appointment-status">
                  <Badge tone={a.status === 'Confirmado' ? 'success' : a.status === 'Realizado' ? 'mint' : 'warning'}>
                    {a.status}
                  </Badge>
                  <small>{a.modalidade}</small>
                </div>
              </div>
            ))
          )}

          <button className="panel-link" onClick={() => go('agenda')}>
            Abrir Agenda Completa <ArrowRight size={15} />
          </button>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Acesso Rápido</h3>
              <p>Atalhos diretos para as rotinas clínicas.</p>
            </div>
            <Sparkles size={18} />
          </div>

          {[
            ['pacientes', Users, 'Novo Paciente', 'Cadastre pacientes com conformidade LGPD'],
            ['agenda', CalendarDays, 'Novo Agendamento', 'Marque consultas com sala de vídeo automática'],
            ['online', Video, 'Sala de Videochamada', 'Atendimento online via Jitsi Meet integrado'],
            ['prontuarios', FileText, 'Evolução Clínica', 'Prontuários com criptografia AES-256'],
            ['documentos', FileText, 'Gerar Documento PDF', 'Declarações, relatórios e recibos instantâneos'],
            ['planos', Wallet, 'Planos & Cobrança', 'Mercado Pago integrado (Básico / Premium)']
          ].map(([id, Icon, title, desc]) => (
            <button className="quick-link" key={id} onClick={() => go(id)}>
              <span className="quick-icon">
                <Icon size={18} />
              </span>
              <span>
                <b>{title}</b>
                <small>{desc}</small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
        </section>
      </div>

      <div className="notice">
        <ShieldCheck size={18} />
        <span>
          <b>Segurança e LGPD ativas:</b> Seus prontuários são criptografados e cada acesso gera registro rastreável na
          auditoria do sistema.
        </span>
      </div>
    </div>
  );
}
