import React, { useEffect, useState } from 'react';
import { Sparkles, Check, CreditCard, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { Heading, Badge } from '../components/UI';
import { obterPlanoAtual, obterCatalogoPlanos, listarHistoricoPlanos, iniciarCheckoutPlano } from '../services/api';

const money = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

export default function PlanosPage() {
  const [planoAtual, setPlanoAtual] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [atual, cat, hist] = await Promise.all([
        obterPlanoAtual(),
        obterCatalogoPlanos(),
        listarHistoricoPlanos()
      ]);
      setPlanoAtual(atual);
      setCatalogo(cat);
      setHistorico(hist);
    } catch (e) {
      setError(e.message || 'Erro ao carregar dados de assinaturas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function contratarPlano(nomePlano) {
    if (planoAtual?.assinatura?.plano?.toLowerCase() === nomePlano.toLowerCase()) {
      alert('Você já está utilizando este plano.');
      return;
    }

    setCheckoutLoading(true);
    setError('');
    try {
      const res = await iniciarCheckoutPlano(nomePlano);
      if (res.checkout_url) {
        setNotice(`Redirecionando para o Mercado Pago (${nomePlano})...`);
        // Abre o checkout do Mercado Pago
        window.open(res.checkout_url, '_blank');
      } else {
        setNotice(`Plano ${nomePlano} ativado com sucesso!`);
      }
      await load();
    } catch (err) {
      setError(err.message || 'Erro ao processar assinatura no Mercado Pago.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  const planoAtivoNome = planoAtual?.assinatura?.plano || 'Básico';

  return (
    <div className="page-content">
      <Heading
        title="Planos & Assinatura — Mercado Pago"
        subtitle="Gerencie seu plano da Clínica PSICO com pagamento seguro via PIX, Cartão ou Boleto pelo Mercado Pago."
      />

      {notice && (
        <div className="notice inline-notice">
          {notice}
          <button onClick={() => setNotice('')}>
            <X size={15} />
          </button>
        </div>
      )}
      {error && <div className="alert-error">{error}</div>}

      <div className="current-plan" style={{ marginBottom: 25 }}>
        <div>
          <span className="eyebrow light">PLANO ATIVO</span>
          <h2>Plano {planoAtivoNome}</h2>
          <p>
            Status:{' '}
            <Badge tone="success">
              {planoAtual?.assinatura?.status || 'Ativo'}
            </Badge>{' '}
            • Válido desde {planoAtual?.assinatura?.inicio || 'Hoje'}
          </p>
        </div>
        <b>
          {money(planoAtual?.assinatura?.valor || 69)}{' '}
          <small style={{ fontSize: 13, fontWeight: 400 }}>/ mês</small>
        </b>
      </div>

      <div className="section-title">
        <div>
          <h2>Planos Disponíveis</h2>
          <p>Selecione o plano ideal para a estrutura da sua clínica ou consultório.</p>
        </div>
      </div>

      <div className="plans-grid" style={{ marginBottom: 30 }}>
        {catalogo.map((p) => {
          const isCurrent = planoAtivoNome.toLowerCase() === p.nome.toLowerCase();
          return (
            <div className={`plan-card ${isCurrent ? 'selected' : ''}`} key={p.id}>
              <div className="plan-card-top">
                <span className="module-icon">
                  <Sparkles size={20} />
                </span>
                {isCurrent && <Badge tone="success">Plano Atual</Badge>}
              </div>
              <h3>Plano {p.nome}</h3>
              <div className="plan-price">
                <b>{money(p.preco)}</b>
                <small>/ mês</small>
              </div>
              <ul>
                {p.recursos.map((rec) => (
                  <li key={rec}>
                    <Check size={15} color="#2e7865" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled={checkoutLoading || isCurrent}
                className={isCurrent ? 'secondary-button full' : 'primary-button full'}
                onClick={() => contratarPlano(p.nome)}
              >
                {isCurrent ? 'Plano Ativo' : `Assinar ${p.nome} com Mercado Pago`}
              </button>
            </div>
          );
        })}
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div>
            <h3>Histórico de Faturas & Assinaturas</h3>
            <p>{historico.length} registro(s) no histórico</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Plano</th>
                <th>Valor</th>
                <th>Data de Início</th>
                <th>Status</th>
                <th>Gateway</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id}>
                  <td>
                    <b>Plano {h.plano}</b>
                  </td>
                  <td>{money(h.valor)}</td>
                  <td>{h.inicio}</td>
                  <td>
                    <Badge tone={h.status === 'Ativo' ? 'success' : 'neutral'}>{h.status}</Badge>
                  </td>
                  <td>
                    <span style={{ fontSize: 10, color: '#009ee3', fontWeight: 700 }}>
                      Mercado Pago {h.mercadopago_id ? `(#${h.mercadopago_id.slice(0, 8)})` : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {historico.length === 0 && <div className="empty">Nenhum histórico anterior.</div>}
        </div>
      </section>

      <div className="notice" style={{ marginTop: 20 }}>
        <ShieldCheck size={18} />
        <span>
          <b>Transações Protegidas:</b> A cobrança é processada com segurança pelo Mercado Pago. Você pode alterar seu plano a qualquer momento.
        </span>
      </div>
    </div>
  );
}
