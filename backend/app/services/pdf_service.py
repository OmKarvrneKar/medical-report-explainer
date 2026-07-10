from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
import json
from datetime import datetime

# ── Colour palette ─────────────────────────────────────────────────────────────
BLUE        = colors.HexColor("#185FA5")
LIGHT_BLUE  = colors.HexColor("#E6F1FB")
GREEN       = colors.HexColor("#27500A")
LIGHT_GREEN = colors.HexColor("#EAF3DE")
AMBER       = colors.HexColor("#633806")
LIGHT_AMBER = colors.HexColor("#FAEEDA")
RED         = colors.HexColor("#791F1F")
LIGHT_RED   = colors.HexColor("#FCEBEB")
GREY        = colors.HexColor("#888888")
LIGHT_GREY  = colors.HexColor("#F7F7F5")
DARK        = colors.HexColor("#1A1A1A")
WHITE       = colors.white

RISK_COLORS = {
    "normal": (LIGHT_GREEN, GREEN),
    "low":    (LIGHT_AMBER, AMBER),
    "high":   (LIGHT_RED,   RED),
}

STATUS_LABELS = {
    "normal":           ("All Values Normal",        LIGHT_GREEN, GREEN),
    "attention_needed": ("Some Values Need Attention", LIGHT_AMBER, AMBER),
    "urgent_review":    ("Please See a Doctor Soon",  LIGHT_RED,   RED),
}


def _styles():
    """Build and return all paragraph styles."""
    base = getSampleStyleSheet()

    def make(name, parent="Normal", **kwargs):
        return ParagraphStyle(name, parent=base[parent], **kwargs)

    return {
        "header_title": make("header_title",
            fontSize=22, textColor=WHITE,
            fontName="Helvetica-Bold", leading=28),
        "header_sub": make("header_sub",
            fontSize=10, textColor=colors.HexColor("#C8DFF5"),
            fontName="Helvetica", leading=14),
        "section_heading": make("section_heading",
            fontSize=11, textColor=BLUE,
            fontName="Helvetica-Bold", leading=16,
            spaceAfter=4),
        "body": make("body",
            fontSize=10, textColor=DARK,
            fontName="Helvetica", leading=15),
        "body_small": make("body_small",
            fontSize=9, textColor=GREY,
            fontName="Helvetica", leading=13),
        "summary_text": make("summary_text",
            fontSize=11, textColor=DARK,
            fontName="Helvetica", leading=17),
        "param_name": make("param_name",
            fontSize=10, textColor=DARK,
            fontName="Helvetica-Bold", leading=14),
        "param_body": make("param_body",
            fontSize=9, textColor=colors.HexColor("#444444"),
            fontName="Helvetica", leading=13),
        "disclaimer": make("disclaimer",
            fontSize=8, textColor=GREY,
            fontName="Helvetica-Oblique", leading=12,
            alignment=TA_CENTER),
        "status_text": make("status_text",
            fontSize=11, fontName="Helvetica-Bold", leading=15),
    }


def generate_report_pdf(report: dict) -> bytes:
    """
    Takes a report dict (same shape as the /upload response)
    and returns a PDF as bytes.
    """
    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.8 * cm, rightMargin=1.8 * cm,
        topMargin=1.5 * cm,  bottomMargin=2 * cm,
    )

    W = A4[0] - 3.6 * cm   # usable width
    st = _styles()
    story = []

    # parse parameters if stored as JSON string (SQLite returns strings)
    parameters = report.get("parameters", [])
    if isinstance(parameters, str):
        try:
            parameters = json.loads(parameters)
        except Exception:
            parameters = []

    # ── 1. HEADER BANNER ─────────────────────────────────────────────────────
    generated_on = datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")
    lang         = report.get("language", "English")

    header_data = [[
        Paragraph("Medical Report Explainer", st["header_title"]),
        Paragraph(
            f"Generated on: {generated_on}<br/>Language: {lang}",
            st["header_sub"]
        ),
    ]]
    header_table = Table(header_data, colWidths=[W * 0.6, W * 0.4])
    header_table.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, -1), BLUE),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",  (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING",(0,0), (-1, -1), 16),
        ("LEFTPADDING", (0, 0), (0,  -1), 16),
        ("RIGHTPADDING",(-1,0), (-1, -1), 16),
        ("ROUNDEDCORNERS", [8]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── 2. OVERALL STATUS BANNER ─────────────────────────────────────────────
    status_key    = report.get("overall_status", "normal")
    s_label, s_bg, s_fg = STATUS_LABELS.get(status_key, STATUS_LABELS["normal"])
    status_para   = Paragraph(f"● {s_label}", ParagraphStyle(
        "status_inline", fontSize=11,
        fontName="Helvetica-Bold",
        textColor=s_fg, leading=15,
    ))
    status_tbl = Table([[status_para]], colWidths=[W])
    status_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), s_bg),
        ("TOPPADDING",   (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 10),
        ("LEFTPADDING",  (0, 0), (-1, -1), 14),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story.append(status_tbl)
    story.append(Spacer(1, 0.45 * cm))

    # ── 3. SUMMARY ───────────────────────────────────────────────────────────
    story.append(Paragraph("Summary", st["section_heading"]))
    story.append(HRFlowable(width=W, thickness=0.5, color=LIGHT_BLUE, spaceAfter=6))
    story.append(Paragraph(report.get("summary", "—"), st["summary_text"]))
    story.append(Spacer(1, 0.5 * cm))

    # ── 4. TEST RESULTS TABLE ─────────────────────────────────────────────────
    if parameters:
        for panel in parameters:
            panel_name = panel.get("name", "General Panel")
            story.append(Paragraph(panel_name, st["section_heading"]))
            if panel.get("summary"):
                story.append(Paragraph(panel.get("summary"), st["body"]))
                story.append(Spacer(1, 0.2 * cm))
                
            story.append(HRFlowable(width=W, thickness=0.5, color=LIGHT_BLUE, spaceAfter=8))

            panel_params = panel.get("parameters", [])
            for p in panel_params:
                risk        = p.get("risk_level", "normal")
                bg, fg      = RISK_COLORS.get(risk, RISK_COLORS["normal"])
                flag        = p.get("flag")

                # Row 1 — test name + risk badge
                badge_text  = risk.upper()
                badge_para  = Paragraph(badge_text, ParagraphStyle(
                    "badge", fontSize=8, fontName="Helvetica-Bold",
                    textColor=fg, leading=10, alignment=TA_CENTER,
                ))
                name_para   = Paragraph(p.get("name", "—"), st["param_name"])

                row1        = Table(
                    [[name_para, badge_para]],
                    colWidths=[W * 0.78, W * 0.22]
                )
                row1.setStyle(TableStyle([
                    ("BACKGROUND",   (1, 0), (1, 0), bg),
                    ("VALIGN",       (0, 0), (-1,-1), "MIDDLE"),
                    ("TOPPADDING",   (0, 0), (-1,-1), 4),
                    ("BOTTOMPADDING",(0, 0), (-1,-1), 4),
                    ("LEFTPADDING",  (0, 0), (0, 0), 0),
                    ("RIGHTPADDING", (1, 0), (1, 0), 0),
                    ("ROUNDEDCORNERS", [4]),
                ]))

                # Row 2 — value + normal range
                value_str  = (
                    f"Your value: <b>{p.get('value','—')}</b>"
                    f"     Normal range: {p.get('normal_range','—')}"
                )
                # Row 3 — flag (only if abnormal)
                # Row 4 — explanation
                inner = [
                    [row1],
                    [Paragraph(value_str, st["param_body"])],
                ]
                if flag:
                    inner.append([Paragraph(f"⚠  {flag}", ParagraphStyle(
                        "flag", fontSize=9, fontName="Helvetica-Bold",
                        textColor=AMBER, leading=12,
                    ))])
                
                explanation = p.get("patient_explanation", p.get("explanation", ""))
                inner.append([Paragraph(explanation, st["param_body"])])

                card = Table(inner, colWidths=[W - 1.2 * cm])
                card.setStyle(TableStyle([
                    ("BACKGROUND",    (0, 0), (-1, -1), WHITE),
                    ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#EEEEEE")),
                    ("TOPPADDING",    (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING",   (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
                    ("ROUNDEDCORNERS", [6]),
                ]))

                # Wrap card in a coloured left-border accent
                accent = Table([[card]], colWidths=[W])
                accent.setStyle(TableStyle([
                    ("LEFTPADDING",  (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING",   (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
                ]))
                story.append(accent)

        story.append(Spacer(1, 0.3 * cm))

    # ── 5. WHAT TO DO NEXT ────────────────────────────────────────────────────
    story.append(Paragraph("What To Do Next", st["section_heading"]))
    story.append(HRFlowable(width=W, thickness=0.5, color=LIGHT_BLUE, spaceAfter=6))
    advice_tbl = Table(
        [[Paragraph(report.get("what_to_do", "—"), st["body"])]],
        colWidths=[W]
    )
    advice_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), LIGHT_GREY),
        ("TOPPADDING",    (0,0),(-1,-1), 10),
        ("BOTTOMPADDING", (0,0),(-1,-1), 10),
        ("LEFTPADDING",   (0,0),(-1,-1), 14),
        ("RIGHTPADDING",  (0,0),(-1,-1), 14),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story.append(advice_tbl)
    story.append(Spacer(1, 0.6 * cm))

    # ── 6. FOOTER DISCLAIMER ─────────────────────────────────────────────────
    story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor("#DDDDDD")))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(report.get("disclaimer", ""), st["disclaimer"]))
    story.append(Paragraph(
        "Generated by Medical Report Explainer · For personal use only",
        st["disclaimer"]
    ))

    # ── Build ─────────────────────────────────────────────────────────────────
    doc.build(story)
    return buffer.getvalue()
