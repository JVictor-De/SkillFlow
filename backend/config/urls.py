"""Top-level URL configuration."""
from __future__ import annotations

import logging
import re

from django.conf import settings
from django.contrib import admin
from django.db import connections
from django.db.utils import OperationalError
from django.http import JsonResponse
from django.urls import path, re_path
from django.views.static import serve

from apps.api import api

logger = logging.getLogger("skillflow.health")


def healthcheck(request):
    """Public liveness endpoint used by infra (Coolify, k8s, load balancers).

    By default returns ``{"status": "ok"}`` for cheap liveness probes. When
    called with ``?deep=1`` it exercises the database connection so monitoring
    can distinguish between an alive process and a healthy stack — without
    coupling the cheap liveness probe to the database.
    """
    payload: dict = {"status": "ok", "version": "1.0.0"}
    deep = request.GET.get("deep") in {"1", "true", "yes"}
    if deep:
        db_status = "ok"
        try:
            connections["default"].cursor().execute("SELECT 1")
        except OperationalError as exc:  # pragma: no cover - infra error
            logger.warning("healthcheck deep DB error: %s", exc)
            db_status = "fail"
            payload["status"] = "degraded"
        payload["db"] = db_status
    status_code = 200 if payload["status"] != "fail" else 503
    return JsonResponse(payload, status=status_code)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", healthcheck, name="health"),
    path("api/", api.urls),
]

# Serve uploaded media (PDFs de submissões e materiais de apoio) tanto em
# desenvolvimento quanto em produção. Sem isso, com `DEBUG=False` Django
# devolve 404 para `/media/...` e o frontend (que apenas absolutiza o caminho
# retornado pela API) não consegue abrir o PDF em nova aba — exatamente o
# bug reportado de "PDF abrindo 404".
#
# O helper oficial `django.conf.urls.static.static()` é no-op fora de DEBUG,
# então registramos o pattern manualmente. Em deploys de larga escala o ideal
# é offload para nginx/CDN; aqui (Coolify proxiando direto para gunicorn)
# servir via Django é aceitável para o volume atual e mantém o fluxo
# self-contained.
_MEDIA_PREFIX = re.escape(settings.MEDIA_URL.lstrip("/"))
urlpatterns += [
    re_path(
        rf"^{_MEDIA_PREFIX}(?P<path>.*)$",
        serve,
        kwargs={"document_root": settings.MEDIA_ROOT},
        name="media",
    ),
]
