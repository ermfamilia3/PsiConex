import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, CalendarDays, Wallet, FileText, Download } from 'lucide-react';
import { Heading, Stat, Badge } from '../components/UI';
import { obterResumoRelatorios, obterFluxoCaixa, listarPacientes, listarAgenda } from '../services/api';

const money = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

export default function RelatoriosPage() {
  const [resumo, setResumo] = useState(null);
  const [fluxo, setFluxo] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [r, flx, pats, ags] = await Promise.all([
          obterResumoRelatorios(),
          obterFluxoCaixa(),
          listarPacientes(),
          listarAgenda()
        ]);
        setResumo(r);
        setFluxo(flx);
        setPacientes(pats);
        setAgendamentos(ags);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalSessoes = agendamentos.length;
  const realizadas = agendamentos.filter((a) => a.status === 'Realizado').length;
  const canceladas = agendamentos.filter((a) => a.status === 'Cancelado').length;
  const taxaPresenca = totalSessoes > 0 ? Math.round((realizadas / (totalSessoes - canceladas || 1)) * 100) : 100;

  return (
    <div className="page-content">
      <Heading
        title="Relatórios & Métricas Gerenciais"
        subtitle="Acompanhe indicadores de frequência, retenção de pacientes, fluxo de caixa e produtividade clínica."
      />

      <div className="stats-grid" style={{ marginBottom: 25 }}>
        <Stat
          icon={Users}
          label="Total de Pacientes"
          value={String(resumo?.total_pacientes || 0)}
          note={`${resumo?.pacientes_ativos || 0} ativos no momento`}
          tone="lavender"
        />
        <Stat
          icon={CalendarDays}
          label="Consultas do Mês"
          value={String(resumo?.total_agendamentos_mes || 0)}
          note={`Taxa de realização: ${taxaPresenca}%`}
          tone="mint"
        />
        <Stat
          icon={Wallet}
          label="Receita Bruta do Mês"
          value={money(resumo?.total_receitas_mes || 0)}
          note={`Despesas: ${money(resumo?.total_despesas_mes || 0)}`}
          tone="blue"
        />
        <Stat
          icon={TrendingUp}
          label="Resultado Líquido"
          value={money(resumo?.saldo_mes || 0)}
          note="Margem operacional positiva"
          tone="peach"
        />
      </div>

      <div className="dashboard-columns" style={{ marginBottom: 25 }}>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Composição por Modalidade de Atendimento</h3>
              <p>Preferência dos pacientes cadastrados</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {[
              {
                label: 'Atendimento On-line',
                count: pacientes.filter((p) => p.modalidade === 'On-line').length,
                color: '#0284c7'
              },
              {
                label: 'Atendimento Presencial',
                count: pacientes.filter((p) => p.modalidade === 'Presencial').length,
                color: '#2e7865'
              },
              {
                label: 'Atendimento Híbrido',
                count: pacientes.filter((p) => p.modalidade === 'Híbrido').length,
                color: '#d97706'
              }
            ].map((item) => {
              const pct = pacientes.length > 0 ? Math.round((item.count / pacientes.length) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <b>{item.label}</b>
                    <span>
                      {item.count} pacientes ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Status das Sessões Agendadas</h3>
              <p>Histórico geral de comparecimento</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {[
              { status: 'Realizado', tone: 'success', count: realizadas },
              { status: 'Confirmado', tone: 'mint', count: agendamentos.filter((a) => a.status === 'Confirmado').length },
              { status: 'Aguardando', tone: 'peach', count: agendamentos.filter((a) => a.status === 'Aguardando').length },
              { status: 'Cancelado', tone: 'warning', count: canceladas }
            ].map((st) => (
              <div
                key={st.status}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#f8faf9',
                  borderRadius: 6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge tone={st.tone}>{st.status}</Badge>
                </div>
                <b>{st.count} sessão(ões)</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
