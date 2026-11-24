import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, RefreshCw, Lock, AlertCircle, FileText } from 'lucide-react';
import { Heading, Badge } from '../components/UI';
import { listarAuditoria } from '../services/api';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await listarAuditoria(150);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = logs.filter(
    (l) =>
      `${l.acao} ${l.tabela} ${l.timestamp} ${l.dados_novos || ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  return (
    <div className="page-content">
      <Heading
        title="Auditoria, Rastreabilidade & LGPD"
        subtitle="Registro imutável de todas as ações no sistema: acessos a prontuários, cadastros, emissão de documentos e logins."
      />

      <div className="notice" style={{ marginBottom: 20 }}>
        <ShieldCheck size={18} />
        <span>
          <b>Conformidade com a LGPD (Lei 13.709/2018):</b> Toda visualização de registro clínico e movimentação de dados é
          registrada com carimbo de data/hora para fins de conformidade jurídica e segurança do paciente.
        </span>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3>Trilha de Auditoria do Sistema</h3>
            <p>{logs.length} evento(s) mais recentes auditados</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label className="table-search">
              <Search size={15} />
              <input
                placeholder="Filtrar por ação ou tabela..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button className="icon-button" onClick={load} title="Atualizar">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty">Carregando logs de auditoria...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Ação</th>
                  <th>Módulo / Tabela</th>
                  <th>ID do Registro</th>
                  <th>Detalhes do Evento</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <small style={{ color: '#555', fontFamily: 'monospace' }}>
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </small>
                    </td>
                    <td>
                      <span className="audit-badge">{log.acao}</span>
                    </td>
                    <td>
                      <b>{log.tabela}</b>
                    </td>
                    <td>#{log.registro_id || '—'}</td>
                    <td>
                      <small style={{ color: '#64748b', fontSize: 10 }}>
                        {log.dados_novos ? log.dados_novos.slice(0, 80) : 'Registro de acesso / operação padrão'}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty">Nenhum evento registrado com o filtro selecionado.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
