import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "nao-responda@clinicapsico.com.br")

def enviar_email(destinatario: str, assunto: str, corpo_html: str, corpo_texto: str = None) -> bool:
    """
    Envia email via SMTP autenticado.
    Se SMTP_HOST não estiver configurado, loga simulação sem falhar.
    """
    if not SMTP_HOST or not SMTP_USER:
        print(f"[EMAIL MOCK] Para: {destinatario} | Assunto: {assunto}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = assunto
        msg["From"] = SMTP_FROM
        msg["To"] = destinatario

        if corpo_texto:
            msg.attach(MIMEText(corpo_texto, "plain", "utf-8"))
        msg.attach(MIMEText(corpo_html, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, [destinatario], msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Falha ao enviar para {destinatario}: {e}")
        return False

def enviar_notificacao_agendamento(paciente_nome: str, email: str, data: str, hora: str, modalidade: str, link_sala: str = None):
    assunto = f"Confirmação de Agendamento — Clínica PSICO"
    corpo_html = f"""
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2e7865;">Olá, {paciente_nome}!</h2>
        <p>Seu atendimento foi agendado com sucesso na <b>Clínica PSICO</b>.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><b>Data:</b> {data}</p>
            <p style="margin: 5px 0;"><b>Horário:</b> {hora}</p>
            <p style="margin: 5px 0;"><b>Modalidade:</b> {modalidade}</p>
            {f'<p style="margin: 5px 0;"><b>Sala de Vídeo:</b> <a href="{link_sala}" style="color: #2e7865;">Acessar Videochamada</a></p>' if link_sala else ''}
        </div>
        <p style="font-size: 13px; color: #666;">Em caso de dúvidas ou necessidade de reagendamento, entre em contato conosco.</p>
    </div>
    """
    return enviar_email(email, assunto, corpo_html)
