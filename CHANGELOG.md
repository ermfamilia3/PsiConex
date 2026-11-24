# 📝 CHANGELOG — CLÍNICA PSICO

## [2.0.0] - 2026-11-17

### 🚀 Novidades e Integrações
- **Banco de Dados Relacional**: Criadas 11 tabelas dedicadas substituindo o modelo anterior que armazenava os módulos em JSON.
- **Módulo Psicólogos**: Cadastro completo de profissionais da clínica com registro no CRP, especialidades, abordagem teórica e status.
- **Módulo Agenda & Calendário**: Visualização de calendário mensal dinâmico e lista cronológica, com vinculação obrigatória de paciente e profissional.
- **Atendimento On-line com Jitsi Meet**: Integração nativa de videoconferência telepsicológica por WebRTC diretamente dentro da plataforma, com geração automática de link e sala privada.
- **Prontuários com Evolução Clínica**: Prontuário eletrônico confidencial com criptografia simétrica AES-256 no campo de evolução e trilha de auditoria para atendimento à LGPD e normas do CFP.
- **Emissão de Documentos em PDF**: Geração e download em 1 clique de Declarações, Laudos, Relatórios Psicológicos, Encaminhamentos e Recibos com formatação executiva via ReportLab.
- **Financeiro & Fluxo de Caixa**: Painel completo de movimentações com saldo em tempo real, receitas, despesas e categorização.
- **Planos e Assinaturas com Mercado Pago**: Integração com checkout transparente/pro do Mercado Pago para contratação dos planos Básico (R$ 69) e Premium (R$ 110).
- **Relatórios Gerenciais**: Gráficos e métricas de distribuição por modalidade, taxas de realização de consultas e evolução financeira.
- **Auditoria e LGPD**: Trilha imutável de acessos e consentimentos dos pacientes.

### 🎨 Frontend Modularizado
- O arquivo monolítico `App.jsx` de 39KB foi dividido em 13 páginas independentes e componentes reutilizáveis (`Sidebar`, `Header`, `Modal`, `LoginScreen`, `UI`).
- Configuração do `vite.config.js` com suporte a produção e Docker.
- Build testado e validado com 100% de sucesso.

### 🐳 Deploy e Operação
- Criação de `docker-compose.yml`, `Dockerfile` para backend e frontend (Nginx), manual completo para **PyCharm** e implantação em nuvem.
