"""Merges deterministic + Gemini findings, builds the human summary."""
from __future__ import annotations

from collections import Counter

from .models import BookContext, QAFinding, Severity


SEVERITY_ORDER: dict[Severity, int] = {"critical": 0, "warning": 1, "info": 2}


def merge_findings(
    deterministic: list[QAFinding],
    gemini: list[QAFinding],
) -> list[QAFinding]:
    combined = deterministic + gemini
    # Sort by severity (critical first), then page
    combined.sort(key=lambda f: (SEVERITY_ORDER[f.severity], f.page if f.page is not None else 9999))
    return combined


def count_by_severity(findings: list[QAFinding]) -> dict[Severity, int]:
    counter: Counter[Severity] = Counter(f.severity for f in findings)
    return {
        "critical": counter.get("critical", 0),
        "warning": counter.get("warning", 0),
        "info": counter.get("info", 0),
    }


def build_human_summary(
    findings: list[QAFinding],
    ctx: BookContext,
    gemini_overall: str = "",
) -> str:
    """Produces a Spanish-language summary the admin sees on screen."""
    counts = count_by_severity(findings)
    couple = ctx.couple.print_name or ctx.couple.display_name

    lines: list[str] = []
    lines.append(f"Revisión del libro de **{couple}**.")
    lines.append("")
    lines.append(
        f"Encontré **{counts['critical']} críticos**, **{counts['warning']} warnings** "
        f"y **{counts['info']} info** en el PDF."
    )
    lines.append("")

    if counts["critical"] == 0 and counts["warning"] == 0:
        lines.append("✅ No encontré problemas críticos ni warnings. El libro se ve bien para imprimir.")
    elif counts["critical"] == 0:
        lines.append(
            "⚠️ No hay problemas críticos, pero sí algunos warnings que vale la pena revisar antes de imprimir."
        )
    else:
        lines.append(
            "🚨 Hay problemas críticos que deberías resolver antes de mandar a imprenta."
        )

    if gemini_overall:
        lines.append("")
        lines.append("**Observaciones generales del agente visual:**")
        lines.append(gemini_overall.strip())

    lines.append("")
    lines.append(
        "_Esta revisión cubre contenido y estructura visual. No reemplaza el preflight "
        "de impresión de InDesign (CMYK, sangrados, kerning) ni el ojo humano final._"
    )

    return "\n".join(lines)
