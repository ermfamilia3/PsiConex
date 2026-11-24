import os
import io
from datetime import datetime

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def gerar_documento_pdf(
    tipo: str,
    titulo: str,
    conteudo: str,
    data_doc: str,
    paciente_nome: str,
    paciente_cpf: str = None,
    psicologo_nome: str = None,
    psicologo_crp: str = None,
    clinica_nome: str = "Clínica PSICO"
) -> bytes:
    """
    Gera um PDF formatado para declaração, laudo, recibo ou relatório psicológico.
    Retorna bytes do PDF.
    """
    buffer = io.BytesIO()

    if not REPORTLAB_AVAILABLE:
        # Fallback simples em formato de texto para quando reportlab ainda não estiver instalado
        text_content = f"""
================================================================================
{clinica_nome.upper()} - DOCUMENTO PROFISSIONAL
================================================================================
Tipo: {tipo}
Título: {titulo}
Data: {data_doc}

Paciente: {paciente_nome}
CPF: {paciente_cpf or 'Não informado'}
Profissional: {psicologo_nome or 'Não informado'}
CRP: {psicologo_crp or 'Não informado'}
--------------------------------------------------------------------------------
CONTEÚDO:
{conteudo}
--------------------------------------------------------------------------------
Assinatura Digital / Documento emitido eletronicamente via Sistema Clínica PSICO
================================================================================
        """
        buffer.write(text_content.encode("utf-8"))
        buffer.seek(0)
        return buffer.getvalue()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#2e7865'),
        alignment=1 # Center
    )
    
    sub_header = ParagraphStyle(
        'SubHeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#666666'),
        alignment=1 # Center
    )
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1f2937'),
        alignment=1,
        spaceAfter=15
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=17,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#2e7865')
    )

    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#374151')
    )

    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#888888'),
        alignment=1
    )

    elements = []

    # Cabeçalho da Clínica
    elements.append(Paragraph(f"<b>{clinica_nome}</b>", header_style))
    elements.append(Paragraph("Gestão Clínica & Cuidado Psicológico Integrado", sub_header))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2e7865'), spaceAfter=15))

    # Título do Documento
    elements.append(Paragraph(f"{tipo.upper()}: {titulo.upper()}", title_style))
    elements.append(Spacer(1, 10))

    # Tabela com Metadados
    meta_data = [
        [Paragraph("Paciente:", meta_style), Paragraph(paciente_nome, meta_val),
         Paragraph("Data de Emissão:", meta_style), Paragraph(str(data_doc), meta_val)],
        [Paragraph("CPF:", meta_style), Paragraph(paciente_cpf or "Não informado", meta_val),
         Paragraph("Profissional:", meta_style), Paragraph(f"{psicologo_nome or 'Não atribuído'}", meta_val)],
        [Paragraph("", meta_style), Paragraph("", meta_val),
         Paragraph("CRP:", meta_style), Paragraph(psicologo_crp or "Não informado", meta_val)]
    ]

    t = Table(meta_data, colWidths=[65, 175, 100, 155])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.25, colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Conteúdo Principal
    paragraphs = (conteudo or "Sem observações adicionais.").split("\n")
    for p in paragraphs:
        if p.strip():
            elements.append(Paragraph(p, body_style))
        else:
            elements.append(Spacer(1, 8))

    elements.append(Spacer(1, 40))

    # Assinatura
    if psicologo_nome:
        sig_data = [
            [HRFlowable(width="60%", thickness=1, color=colors.HexColor('#4b5563'), spaceAfter=5)],
            [Paragraph(f"<b>{psicologo_nome}</b>", footer_style)],
            [Paragraph(f"Psicólogo(a) — CRP: {psicologo_crp or 'Não informado'}", footer_style)]
        ]
        sig_table = Table(sig_data, colWidths=[495])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 2),
        ]))
        elements.append(sig_table)

    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=8))
    elements.append(Paragraph(
        "Documento emitido eletronicamente conforme resolução do Conselho Federal de Psicologia e Lei Geral de Proteção de Dados (LGPD).",
        footer_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
