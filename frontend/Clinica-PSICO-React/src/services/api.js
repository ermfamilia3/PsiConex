const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').trim().replace(/\/$/, '');
const API_URL = rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
  ? rawApiUrl
  : `https://${rawApiUrl}`;

async function request(path, options = {}) {
  const token = localStorage.getItem('clinica_psico_token');
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  
  // Tratamento especial para downloads de binários (ex: PDF)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || options.responseType === 'blob') {
    if (!response.ok) throw new Error('Erro ao baixar documento');
    return await response.blob();
  }

  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = data && data.detail
      ? (Array.isArray(data.detail) ? data.detail.map(x => x.msg).join(', ') : data.detail)
      : `Erro HTTP ${response.status}`;
    throw new Error(detail);
  }
  return data;
}

// ─────────────────────────────────────────────
// AUTENTICAÇÃO & USUÁRIO
// ─────────────────────────────────────────────
export async function login(email, senha) {
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', senha);
  const result = await request('/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  });
  if (result.access_token) {
    localStorage.setItem('clinica_psico_token', result.access_token);
    localStorage.setItem('clinica_psico_user', JSON.stringify(result.usuario));
  }
  return result;
}

export async function cadastrarUsuario(dados) {
  return request('/usuarios/', { method: 'POST', body: JSON.stringify(dados) });
}

export async function obterUsuarioAtual() {
  return request('/usuarios/me');
}

export function logout() {
  localStorage.removeItem('clinica_psico_token');
  localStorage.removeItem('clinica_psico_user');
}

export function temToken() {
  return Boolean(localStorage.getItem('clinica_psico_token'));
}

export { API_URL };

// ─────────────────────────────────────────────
// PACIENTES
// ─────────────────────────────────────────────
export async function listarPacientes(busca = '') {
  const query = busca ? `?busca=${encodeURIComponent(busca)}` : '';
  return request(`/pacientes/${query}`);
}
export async function obterPaciente(id) {
  return request(`/pacientes/${id}`);
}
export async function criarPaciente(dados) {
  return request('/pacientes/', { method: 'POST', body: JSON.stringify(dados) });
}
export async function atualizarPaciente(id, dados) {
  return request(`/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}
export async function excluirPaciente(id) {
  return request(`/pacientes/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────
// PSICÓLOGOS
// ─────────────────────────────────────────────
export async function listarPsicologos() {
  return request('/psicologos/');
}
export async function criarPsicologo(dados) {
  return request('/psicologos/', { method: 'POST', body: JSON.stringify(dados) });
}
export async function atualizarPsicologo(id, dados) {
  return request(`/psicologos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}
export async function excluirPsicologo(id) {
  return request(`/psicologos/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────
// AGENDA
// ─────────────────────────────────────────────
export async function listarAgenda(params = {}) {
  const sp = new URLSearchParams();
  if (params.data_inicio) sp.append('data_inicio', params.data_inicio);
  if (params.data_fim) sp.append('data_fim', params.data_fim);
  if (params.paciente_id) sp.append('paciente_id', params.paciente_id);
  if (params.psicologo_id) sp.append('psicologo_id', params.psicologo_id);
  const q = sp.toString() ? `?${sp.toString()}` : '';
  return request(`/agenda/${q}`);
}
export async function criarAgendamento(dados) {
  return request('/agenda/', { method: 'POST', body: JSON.stringify(dados) });
}
export async function atualizarAgendamento(id, dados) {
  return request(`/agenda/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}
export async function excluirAgendamento(id) {
  return request(`/agenda/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────
// PRONTUÁRIOS
// ─────────────────────────────────────────────
export async function listarProntuarios(paciente_id = null) {
  const q = paciente_id ? `?paciente_id=${paciente_id}` : '';
  return request(`/prontuarios/${q}`);
}
export async function criarProntuario(dados) {
  return request('/prontuarios/', { method: 'POST', body: JSON.stringify(dados) });
}
export async function atualizarProntuario(id, dados) {
  return request(`/prontuarios/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}
export async function excluirProntuario(id) {
  return request(`/prontuarios/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────
// FINANCEIRO & FLUXO DE CAIXA
// ─────────────────────────────────────────────
export async function listarTransacoes(params = {}) {
  const sp = new URLSearchParams();
  if (params.tipo) sp.append('tipo', params.tipo);
  if (params.status) sp.append('status', params.status);
  const q = sp.toString() ? `?${sp.toString()}` : '';
  return request(`/financeiro/${q}`);
}
export async function obterFluxoCaixa() {
  return request('/financeiro/fluxo-caixa');
}
export async function criarTransacao(dados) {
  return request('/financeiro/', { method: 'POST', body: JSON.stringify(dados) });
}
export async function atualizarTransacao(id, dados) {
  return request(`/financeiro/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}
export async function excluirTransacao(id) {
  return request(`/financeiro/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────
// DOCUMENTOS & PDF
// ─────────────────────────────────────────────
export async function listarDocumentos(paciente_id = null) {
  const q = paciente_id ? `?paciente_id=${paciente_id}` : '';
  return request(`/documentos/${q}`);
}
export async function criarDocumento(dados) {
  return request('/documentos/', { method: 'POST', body: JSON.stringify(dados) });
}
export async function atualizarDocumento(id, dados) {
  return request(`/documentos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}
export async function excluirDocumento(id) {
  return request(`/documentos/${id}`, { method: 'DELETE' });
}
export function getDocumentoPdfUrl(id) {
  const token = localStorage.getItem('clinica_psico_token');
  return `${API_URL}/documentos/${id}/pdf`;
}
export async function baixarDocumentoPdf(id) {
  const blob = await request(`/documentos/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `documento_clinica_psico_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// TESTES PSICOLÓGICOS
// ─────────────────────────────────────────────
export async function listarTestes(paciente_id = null) {
  const q = paciente_id ? `?paciente_id=${paciente_id}` : '';
  return request(`/testes/${q}`);
}
export async function criarTeste(dados) {
  return request('/testes/', { method: 'POST', body: JSON.stringify(dados) });
}
export async function atualizarTeste(id, dados) {
  return request(`/testes/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}
export async function excluirTeste(id) {
  return request(`/testes/${id}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────
// PLANOS & MERCADO PAGO
// ─────────────────────────────────────────────
export async function obterCatalogoPlanos() {
  return request('/planos/catalogo');
}
export async function obterPlanoAtual() {
  return request('/planos/atual');
}
export async function listarHistoricoPlanos() {
  return request('/planos/');
}
export async function iniciarCheckoutPlano(planoNome) {
  return request(`/planos/checkout?plano_nome=${encodeURIComponent(planoNome)}`, { method: 'POST' });
}

// ─────────────────────────────────────────────
// AUDITORIA (LGPD)
// ─────────────────────────────────────────────
export async function listarAuditoria(limite = 100) {
  return request(`/auditoria/?limite=${limite}`);
}

// ─────────────────────────────────────────────
// RELATÓRIOS
// ─────────────────────────────────────────────
export async function obterResumoRelatorios() {
  return request('/relatorios/resumo');
}

// ─────────────────────────────────────────────
// CONFIGURAÇÕES
// ─────────────────────────────────────────────
export async function obterConfiguracoes() {
  return request('/configuracoes/');
}
export async function salvarConfiguracoes(dados) {
  return request('/configuracoes/', { method: 'POST', body: JSON.stringify(dados) });
}
