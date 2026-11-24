import React, { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Search, X, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Heading, Badge, Stat } from '../components/UI';
import Modal from '../components/Modal';
import { listarTransacoes, obterFluxoCaixa, criarTransacao, atualizarTransacao, excluirTransacao, listarPacientes, listarPsicologos } from '../services/api';

const hojeISO = () => new Date().toISOString().split('T')[0];
const money = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

export default function FinanceiroPage() {
  const emptyForm = {
    descricao: '',
    tipo: 'Receita',
    categoria: 'Atendimento',
    valor: '',
    data: hojeISO(),
    status: 'Recebido',
    forma_pagamento: 'PIX',
    paciente_id: '',
    psicologo_id: '',
    observacoes: ''
  };

  const [transacoes, setTransacoes] = useState([]);
  const [fluxo, setFluxo] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [psicologos, setPsicologos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('');
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
      const [trs, flx, pats, psis] = await Promise.all([
        listarTransacoes(filtroTipo ? { tipo: filtroTipo } : {}),
        obterFluxoCaixa(),
        listarPacientes(),
        listarPsicologos()
      ]);
      setTransacoes(trs);
      setFluxo(flx);
      setPacientes(pats);
      setPsicologos(psis);
    } catch (e) {
      setError(e.message || 'Erro ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filtroTipo]);

  function startNew(tipoPrevio = 'Receita') {
    setEditing(null);
    setForm({
      ...emptyForm,
      tipo: tipoPrevio,
      descricao: tipoPrevio === 'Receita' ? 'Sessão de Psicoterapia' : '',
      status: tipoPrevio === 'Receita' ? 'Recebido' : 'Pago'
    });
    setError('');
    setOpen(true);
  }

  function startEdit(t) {
    setEditing(t);
    setForm({
      descricao: t.descricao,
      tipo: t.tipo,
      categoria: t.categoria || 'Atendimento',
      valor: String(t.valor),
      data: String(t.data),
      status: t.status,
      forma_pagamento: t.forma_pagamento || 'PIX',
      paciente_id: t.paciente_id ? String(t.paciente_id) : '',
      psicologo_id: t.psicologo_id ? String(t.psicologo_id) : '',
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
        valor: parseFloat(form.valor),
        paciente_id: form.paciente_id ? Number(form.paciente_id) : null,
        psicologo_id: form.psicologo_id ? Number(form.psicologo_id) : null
      };
      if (editing) {
        await atualizarTransacao(editing.id, payload);
        setNotice('Lançamento atualizado.');
      } else {
        await criarTransacao(payload);
        setNotice('Lançamento financeiro registrado com sucesso.');
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.message || 'Erro ao salvar transação.');
    }
  }

  async function remove(id) {
    if (!window.confirm('Excluir este lançamento financeiro?')) return;
    try {
      await excluirTransacao(id);
      setNotice('Lançamento excluído.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-content">
      <Heading
        title="Financeiro & Fluxo de Caixa"
        subtitle="Controle de receitas de atendimentos, despesas operacionais e demonstrativo financeiro."
        action="Novo lançamento"
        onAction={() => startNew('Receita')}
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

      <div className="stats-grid">
        <Stat
          icon={ArrowUpRight}
          label="Receitas Realizadas"
          value={money(fluxo?.total_receitas)}
          note={`+ ${money(fluxo?.receitas_pendentes)} a receber`}
          tone="mint"
        />
        <Stat
          icon={ArrowDownRight}
          label="Despesas Pagas"
          value={money(fluxo?.total_despesas)}
          note={`+ ${money(fluxo?.despesas_pendentes)} a pagar`}
          tone="peach"
        />
        <Stat
          icon={Wallet}
          label="Saldo em Caixa"
          value={money(fluxo?.saldo_atual)}
          note="Receitas realizadas - Despesas"
          tone="blue"
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
        <button
          className={`tab-btn ${filtroTipo === '' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('')}
        >
          Todas as movimentações
        </button>
        <button
          className={`tab-btn ${filtroTipo === 'Receita' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('Receita')}
        >
          Apenas Receitas
        </button>
        <button
          className={`tab-btn ${filtroTipo === 'Despesa' ? 'active' : ''}`}
          onClick={() => setFiltroTipo('Despesa')}
        >
          Apenas Despesas
        </button>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3>Extrato Financeiro</h3>
            <p>{transacoes.length} lançamento(s) registrados</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary-button" onClick={() => startNew('Despesa')}>
              + Nova Despesa
            </button>
            <button className="primary-button" onClick={() => startNew('Receita')}>
              + Nova Receita
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty">Carregando fluxo de caixa...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Paciente / Profissional</th>
                  <th>Data</th>
                  <th>Forma</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.descricao}</b>
                    </td>
                    <td>
                      <span
                        style={{
                          color: t.tipo === 'Receita' ? '#15803d' : '#b91c1c',
                          fontWeight: 700,
                          fontSize: 11
                        }}
                      >
                        {t.tipo === 'Receita' ? '+ Receita' : '- Despesa'}
                      </span>
                    </td>
                    <td>{t.categoria}</td>
                    <td>{t.paciente_nome || t.psicologo_nome || '—'}</td>
                    <td>{t.data}</td>
                    <td>{t.forma_pagamento || '—'}</td>
                    <td>
                      <b
                        style={{
                          color: t.tipo === 'Receita' ? '#15803d' : '#b91c1c',
                          fontSize: 12
                        }}
                      >
                        {money(t.valor)}
                      </b>
                    </td>
                    <td>
                      <Badge tone={t.status === 'Recebido' || t.status === 'Pago' ? 'success' : 'warning'}>
                        {t.status}
                      </Badge>
                    </td>
                    <td>
                      <button className="secondary-button" onClick={() => startEdit(t)}>
                        Editar
                      </button>{' '}
                      <button className="icon-button" title="Excluir" onClick={() => remove(t.id)}>
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transacoes.length === 0 && (
              <div className="empty">Nenhum lançamento financeiro registrado.</div>
            )}
          </div>
        )}
      </section>

      {open && (
        <Modal title={editing ? 'Editar lançamento' : `Novo lançamento · ${form.tipo}`} close={() => setOpen(false)}>
          <form className="modal-form" onSubmit={save}>
            <div className="form-grid">
              <label className="field-label">
                Tipo de movimentação
                <select
                  className="plain-input"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="Receita">Receita (Entrada)</option>
                  <option value="Despesa">Despesa (Saída)</option>
                </select>
              </label>

              <label className="field-label">
                Valor (R$)
                <input
                  className="plain-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </label>
            </div>

            <label className="field-label">
              Descrição
              <input
                className="plain-input"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Consulta psicoterapia, Aluguel da sala, Livros"
                required
              />
            </label>

            <div className="form-grid">
              <label className="field-label">
                Categoria
                <select
                  className="plain-input"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  <option>Atendimento</option>
                  <option>Avaliação psicológica</option>
                  <option>Supervisão clínica</option>
                  <option>Software / Assinatura</option>
                  <option>Materiais clínicos</option>
                  <option>Infraestrutura / Aluguel</option>
                  <option>Outros</option>
                </select>
              </label>

              <label className="field-label">
                Forma de pagamento
                <select
                  className="plain-input"
                  value={form.forma_pagamento}
                  onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}
                >
                  <option>PIX</option>
                  <option>Cartão de Crédito</option>
                  <option>Cartão de Débito</option>
                  <option>Dinheiro em Espécie</option>
                  <option>Boleto Bancário</option>
                  <option>Transferência</option>
                </select>
              </label>
            </div>

            <div className="form-grid">
              <label className="field-label">
                Data do lançamento
                <input
                  className="plain-input"
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  required
                />
              </label>

              <label className="field-label">
                Status do pagamento
                <select
                  className="plain-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Recebido">Recebido</option>
                  <option value="Pago">Pago</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </label>
            </div>

            <div className="form-grid">
              <label className="field-label">
                Paciente vinculado (opcional)
                <select
                  className="plain-input"
                  value={form.paciente_id}
                  onChange={(e) => setForm({ ...form, paciente_id: e.target.value })}
                >
                  <option value="">Nenhum</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                Psicólogo vinculado (opcional)
                <select
                  className="plain-input"
                  value={form.psicologo_id}
                  onChange={(e) => setForm({ ...form, psicologo_id: e.target.value })}
                >
                  <option value="">Nenhum</option>
                  {psicologos.map((psi) => (
                    <option key={psi.id} value={psi.id}>
                      {psi.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && <div className="alert-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="primary-button">{editing ? 'Salvar alterações' : 'Registrar lançamento'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
