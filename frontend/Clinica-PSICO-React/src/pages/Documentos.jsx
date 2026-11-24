import React, { useEffect, useState } from 'react';
import { FileText, Download, Plus, Search, X, CheckCircle, FileCheck, Eye } from 'lucide-react';
import { Heading, Badge } from '../components/UI';
import Modal from '../components/Modal';
import { listarDocumentos, criarDocumento, atualizarDocumento, excluirDocumento, baixarDocumentoPdf, listarPacientes, listarPsicologos } from '../services/api';

const hojeISO = () => new Date().toISOString().split('T')[0];

const MODELOS_DOCUMENTO = {
  'Declaração': 'Declaro para os devidos fins que o(a) paciente acima identificado(a) esteve sob atendimento psicológico nesta data no período das 14:00 às 14:50 horas.',
  'Relatório psicológico': '1. IDENTIFICAÇÃO:\nPaciente sob acompanhamento psicoterápico.\n\n2. DESCRIÇÃO DA DEMANDA:\nO processo teve início para manejo de sintomas de ansiedade e estresse funcional.\n\n3. PROCEDIMENTOS:\nForam realizadas sessões semanais de psicoterapia baseada em evidências.\n\n4. ANÁLISE:\nObserva-se boa evolução clínica, desenvolvimento de recursos de enfrentamento e redução de sintomas.',
  'Laudo': 'O presente laudo psicológico tem como objetivo descrever os resultados da avaliação psicológica realizada com instrumentos e técnicas validadas pelo SATEPSI.',
  'Encaminhamento': 'Ao(À) Colega Médico(a) / Psiquiatra:\nEncaminho o(a) paciente acima citado(a) para avaliação complementar e conduta médica diagnóstica.',
  'Recibo': 'Recebi do(a) paciente acima citado(a) o valor correspondente à prestação de serviços psicológicos referentes às sessões realizadas no mês corrente.'
};

export default function DocumentosPage() {
  const emptyForm = {
    paciente_id: '',
    psicologo_id: '',
    tipo: 'Declaração',
    titulo: 'Declaração de Comparecimento',
    conteudo: MODELOS_DOCUMENTO['Declaração'],
    data: hojeISO(),
    status: 'Finalizado'
  };

  const [documentos, setDocumentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [psicologos, setPsicologos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [docs, pats, psis] = await Promise.all([
        listarDocumentos(),
        listarPacientes(),
        listarPsicologos()
      ]);
      setDocumentos(docs);
      setPacientes(pats);
      setPsicologos(psis);
    } catch (e) {
      setError(e.message || 'Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function mudarTipo(novoTipo) {
    setForm({
      ...form,
      tipo: novoTipo,
      titulo: `${novoTipo} - ${pacientes.find(p => String(p.id) === String(form.paciente_id))?.nome || 'Atendimento'}`,
      conteudo: MODELOS_DOCUMENTO[novoTipo] || ''
    });
  }

  function startNew() {
    setEditing(null);
    const pId = pacientes[0]?.id ? String(pacientes[0].id) : '';
    setForm({
      ...emptyForm,
      paciente_id: pId,
      psicologo_id: psicologos[0]?.id ? String(psicologos[0].id) : ''
    });
    setError('');
    setOpen(true);
  }

  function startEdit(doc) {
    setEditing(doc);
    setForm({
      paciente_id: String(doc.paciente_id),
      psicologo_id: doc.psicologo_id ? String(doc.psicologo_id) : '',
      tipo: doc.tipo,
      titulo: doc.titulo,
      conteudo: doc.conteudo || '',
      data: String(doc.data),
      status: doc.status
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
        await atualizarDocumento(editing.id, payload);
        setNotice('Documento atualizado com sucesso.');
      } else {
        await criarDocumento(payload);
        setNotice('Documento gerado com sucesso! Já está pronto para emissão em PDF.');
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.message || 'Erro ao salvar documento.');
    }
  }

  async function emitirPdf(docId) {
    setDownloading(docId);
    try {
      await baixarDocumentoPdf(docId);
      setNotice('PDF gerado e baixado com sucesso!');
    } catch (err) {
      setError(err.message || 'Erro ao gerar PDF do documento.');
    } finally {
      setDownloading(null);
    }
  }

  async function remove(id) {
    if (!window.confirm('Excluir este documento?')) return;
    try {
      await excluirDocumento(id);
      setNotice('Documento removido.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-content">
      <Heading
        title="Documentos, Laudos & Emissão em PDF"
        subtitle="Emita declarações, relatórios e laudos formatados conforme resoluções do CFP com download imediato em PDF."
        action="Emitir novo documento"
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
            <h3>Documentos Emitidos</h3>
            <p>{documentos.length} documento(s) cadastrados no sistema</p>
          </div>
        </div>

        {loading ? (
          <div className="empty">Carregando documentos...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tipo & Título</th>
                  <th>Paciente</th>
                  <th>Profissional</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações & Emissão</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div>
                        <b>{d.titulo}</b>
                      </div>
                      <small style={{ color: '#2e7865', fontWeight: 600 }}>{d.tipo}</small>
                    </td>
                    <td>
                      <b>{d.paciente_nome}</b>
                    </td>
                    <td>{d.psicologo_nome || 'Não informado'}</td>
                    <td>{d.data}</td>
                    <td>
                      <Badge tone={d.status === 'Finalizado' ? 'success' : 'warning'}>{d.status}</Badge>
                    </td>
                    <td>
                      <button
                        className="pdf-btn"
                        onClick={() => emitirPdf(d.id)}
                        disabled={downloading === d.id}
                        title="Baixar arquivo PDF formatado"
                      >
                        <Download size={13} /> {downloading === d.id ? 'Gerando...' : 'Baixar PDF'}
                      </button>{' '}
                      <button className="secondary-button" onClick={() => setViewing(d)}>
                        Visualizar
                      </button>{' '}
                      <button className="secondary-button" onClick={() => startEdit(d)}>
                        Editar
                      </button>{' '}
                      <button className="icon-button" title="Excluir" onClick={() => remove(d.id)}>
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {documentos.length === 0 && (
              <div className="empty">Nenhum documento emitido. Clique em “Emitir novo documento” para começar.</div>
            )}
          </div>
        )}
      </section>

      {/* Modal de Visualização */}
      {viewing && (
        <Modal title={`${viewing.tipo}: ${viewing.titulo}`} close={() => setViewing(null)}>
          <div style={{ padding: 10 }}>
            <div style={{ background: '#f8faf9', padding: 15, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 15 }}>
              <p style={{ margin: '4px 0' }}><b>Paciente:</b> {viewing.paciente_nome}</p>
              <p style={{ margin: '4px 0' }}><b>Profissional:</b> {viewing.psicologo_nome}</p>
              <p style={{ margin: '4px 0' }}><b>Data de Emissão:</b> {viewing.data}</p>
              <p style={{ margin: '4px 0' }}><b>Status:</b> {viewing.status}</p>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, padding: 10, background: '#fff', border: '1px solid #eee', borderRadius: 6 }}>
              {viewing.conteudo}
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="primary-button" onClick={() => emitirPdf(viewing.id)}>
                <Download size={14} style={{ marginRight: 6 }} /> Baixar este PDF
              </button>
              <button className="secondary-button" onClick={() => setViewing(null)}>
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Criação / Edição */}
      {open && (
        <Modal title={editing ? 'Editar documento' : 'Emitir novo documento'} close={() => setOpen(false)}>
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
                    {p.nome} (CPF: {p.cpf || 'Não informado'})
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label className="field-label">
                Tipo de documento clínico
                <select
                  className="plain-input"
                  value={form.tipo}
                  onChange={(e) => mudarTipo(e.target.value)}
                >
                  <option>Declaração</option>
                  <option>Relatório psicológico</option>
                  <option>Laudo</option>
                  <option>Encaminhamento</option>
                  <option>Recibo</option>
                </select>
              </label>

              <label className="field-label">
                Status
                <select
                  className="plain-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Finalizado</option>
                  <option>Rascunho</option>
                  <option>Em revisão</option>
                </select>
              </label>
            </div>

            <label className="field-label">
              Título do documento
              <input
                className="plain-input"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                required
              />
            </label>

            <div className="form-grid">
              <label className="field-label">
                Data do documento
                <input
                  className="plain-input"
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  required
                />
              </label>
              <label className="field-label">
                Psicólogo(a) emissor
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
              Conteúdo do documento
              <textarea
                className="plain-input"
                rows="7"
                value={form.conteudo}
                onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                required
              />
            </label>

            {error && <div className="alert-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="primary-button">{editing ? 'Salvar alterações' : 'Gerar documento'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
