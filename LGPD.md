# 🔒 POLÍTICA DE SEGURANÇA E CONFORMIDADE LGPD — CLÍNICA PSICO

Este documento consolida as diretrizes técnicas e operacionais implementadas no sistema **Clínica PSICO v2.0** em total conformidade com a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)** e com as resoluções do **Conselho Federal de Psicologia (CFP)**, em especial a Resolução CFP nº 01/2009 (Guarda e Manejo de Prontuários) e a Resolução CFP nº 11/2018 (Prestação de Serviços Psicológicos por Meio de TIC).

---

## 1. Classificação dos Dados Tratados

No âmbito da prática clínica psicológica, os dados são classificados em:
1. **Dados Pessoais Comuns**: Nome, e-mail, telefone, endereço, data de nascimento.
   - *Base Legal*: Execução de contrato e legítimo interesse (Art. 7º, incisos V e IX).
2. **Dados Pessoais Sensíveis**: Informações de saúde mental, histórico clínico, queixas, hipóteses diagnósticas e evolução das sessões.
   - *Base Legal*: Tutela da saúde e consentimento expresso do titular (Art. 11, inciso II, alínea 'f').

---

## 2. Medidas Técnicas de Proteção Implementadas

### 2.1 Criptografia em Repouso (At Rest)
- O campo `evolucao` dos prontuários clínicos é cifrado utilizando algoritmo simétrico **AES-256 (Fernet)** antes de sua gravação no banco de dados.
- Mesmo em caso de dump ou acesso não autorizado à tabela `prontuarios`, o conteúdo clínico textual permanece ilegível sem a chave privada do ambiente (`ENCRYPTION_KEY`).

### 2.2 Controle de Acesso Baseado em Papéis (RBAC)
O sistema conta com separação estrita de perfis:
- **Administrador (`admin`)**: Acesso à gestão da clínica, cadastros de profissionais, configurações e auditoria geral.
- **Psicólogo (`psicologo`)**: Acesso restrito aos pacientes que atende, seus próprios agendamentos e capacidade de registrar/visualizar prontuários confidenciais.
- **Secretária (`secretaria`)**: Acesso restrito a agendamentos, recepção e dados cadastrais, **com bloqueio total de visualização a evoluções de prontuários clínicos**.

### 2.3 Rastreabilidade e Trilha de Auditoria (Audit Trail)
- Todas as ações críticas no sistema geram um registro na tabela `audit_log`:
  - Visualização de prontuários (`LER_REGISTRO`, `LER_LISTA`)
  - Criação de novos pacientes e evoluções (`CRIAR`)
  - Alterações cadastrais e clínicas (`ATUALIZAR`)
  - Emissão e download de documentos e PDFs (`GERAR_PDF`)
  - Tentativas e autenticações bem-sucedidas (`LOGIN`)
- Cada evento registra: ID do usuário operador, tipo de ação, tabela afetada, ID do registro, carimbo de data/hora (UTC) e endereço IP.

### 2.4 Coleta e Gestão de Consentimento
- Cada cadastro de paciente possui o campo `consentimento_lgpd` e registro do momento da confirmação (`data_consentimento`).
- Nas configurações institucionais, a clínica pode personalizar o texto do termo informado ao paciente.

---

## 3. Atendimento On-line e Sigilo das Comunicações

- A integração com **Jitsi Meet** gera salas dinâmicas com identificadores criptograficamente aleatórios.
- A comunicação de áudio e vídeo entre o psicólogo e o paciente opera via **WebRTC com criptografia ponta a ponta (DTLS-SRTP)**.
- O sistema **não grava nem armazena arquivos de áudio ou vídeo das sessões**, respeitando integralmente o sigilo profissional estabelecido pelo Art. 9º do Código de Ética Profissional do Psicólogo.

---

## 4. Retenção e Descarte de Dados

- Conforme a Resolução CFP nº 01/2009, o prontuário psicológico deve ser mantido pelo período mínimo de **5 (cinco) anos** a partir do último atendimento.
- Os backups regulares do banco MySQL devem ser mantidos em armazenamento protegido e com acesso restrito aos administradores responsáveis.
