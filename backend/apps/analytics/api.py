"""Analytics endpoint — `/api/saas/turmas/{id}/analytics/`."""
from __future__ import annotations

from ninja import Router

from apps.accounts.auth import jwt_auth, require_docente
from apps.atividades.services import analytics_para_turma
from apps.escolas.services import get_turma_or_403

saas_analytics_router = Router(tags=["saas-analytics"], auth=jwt_auth)


@saas_analytics_router.get("/turmas/{turma_id}/analytics/", response=dict)
def analytics_turma(request, turma_id: int):
    user = require_docente(request)
    turma = get_turma_or_403(user, turma_id)
    return analytics_para_turma(turma)
