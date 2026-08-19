"""PDF utilities — extension/MIME validation, page limits and text extraction.

The validation here covers the constraints listed in TechSpecs §4.5.2 and the
requirements in section 8 of `PROMPT_API.md`:

* extension `.pdf`
* magic-bytes signature
* size cap
* page-count cap
* malformed-PDF tolerance + structured logs

In dev/tests we use the lightweight `PyPDF2` for both header detection and
text extraction. Production deployments may swap the implementation for
`pdfminer` / `pdf2image` + `pytesseract` without changing the public API.
"""
from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import IO, Iterable

from django.conf import settings
from ninja.errors import HttpError

logger = logging.getLogger("skillflow.services.pdf")

PDF_MAGIC = b"%PDF-"


def _read_first_bytes(file_obj, n: int = 8) -> bytes:
    pos = file_obj.tell() if hasattr(file_obj, "tell") else 0
    if hasattr(file_obj, "seek"):
        file_obj.seek(0)
    data = file_obj.read(n)
    if hasattr(file_obj, "seek"):
        file_obj.seek(pos)
    return data


def validar_upload_pdf(
    upload, *, max_bytes: int, rotulo: str, max_pages: int | None = None
) -> None:
    """Raise ``HttpError(400)`` if ``upload`` fails any guard.

    `upload` accepts both `ninja.files.UploadedFile` and Django's
    `UploadedFile` types (they share the same `.name`, `.size`, `.read`).
    """
    if upload is None:
        raise HttpError(400, f"{rotulo}: arquivo PDF é obrigatório.")
    name = (getattr(upload, "name", "") or "").lower()
    if not name.endswith(".pdf"):
        raise HttpError(400, f"{rotulo}: apenas arquivos .pdf são aceitos.")
    size = getattr(upload, "size", None)
    if size is None:
        if hasattr(upload, "seek") and hasattr(upload, "tell"):
            upload.seek(0, io.SEEK_END)
            size = upload.tell()
            upload.seek(0)
    if size is not None and size > max_bytes:
        raise HttpError(
            400,
            f"{rotulo}: tamanho máximo {max_bytes // (1024 * 1024)} MB.",
        )
    head = _read_first_bytes(upload, len(PDF_MAGIC))
    if not head.startswith(PDF_MAGIC):
        raise HttpError(400, f"{rotulo}: assinatura PDF inválida.")

    max_pages = max_pages or settings.UPLOAD_MAX_PDF_PAGES
    try:
        n_pages = _contar_paginas(upload)
    except Exception:  # pragma: no cover - rare
        logger.warning("%s: falha ao contar páginas, ignorando", rotulo)
        return
    if n_pages > max_pages:
        raise HttpError(
            400, f"{rotulo}: PDF excede o limite de {max_pages} páginas."
        )


def _contar_paginas(upload) -> int:
    try:
        from PyPDF2 import PdfReader  # type: ignore[import-not-found]
    except ImportError:  # pragma: no cover - dependency always installed
        return 0
    pos = upload.tell() if hasattr(upload, "tell") else 0
    upload.seek(0)
    reader = PdfReader(upload)
    pages = len(reader.pages)
    upload.seek(pos)
    return pages


def extrair_texto_pdf(file_path: str | Path) -> str:
    """Best-effort plain-text extraction.

    The function never raises — it falls back to an empty string when PyPDF2
    can't parse the document, leaving the caller free to declare a job
    failed. Production OCR fallback (pdf2image + pytesseract) belongs here.
    """
    try:
        from PyPDF2 import PdfReader  # type: ignore[import-not-found]
    except ImportError:  # pragma: no cover - dependency always installed
        return ""
    try:
        with open(file_path, "rb") as fh:
            reader = PdfReader(fh)
            return "\n".join(
                (page.extract_text() or "") for page in reader.pages
            )
    except Exception as exc:  # pragma: no cover - fragile binary input
        logger.warning("Falha ao extrair texto de %s: %s", file_path, exc)
        return ""
