"""Aggregator for the SkillFlow REST API.

The Django Ninja `NinjaAPI` instance is created once and routers are mounted
under their canonical paths (``/api/auth``, ``/api/saas``, ``/api/app``).
"""
from __future__ import annotations

from ninja import NinjaAPI

from apps.accounts.api import auth_router, mobile_meta_router
from apps.atividades.api import saas_atividades_router, app_atividades_router
from apps.escolas.api import saas_escolas_router
from apps.responsaveis.api import (
    app_responsavel_router,
    saas_responsaveis_router,
)
from apps.submissoes.api import (
    app_submissoes_router,
    saas_submissoes_router,
)
from apps.analytics.api import saas_analytics_router

api = NinjaAPI(
    title="SkillFlow API",
    version="1.0.0",
    description=(
        "REST API for the SkillFlow platform — student exercises, AI grading,"
        " teacher dashboards and parent reports."
    ),
)

api.add_router("/auth", auth_router)
api.add_router("/saas", saas_escolas_router)
api.add_router("/saas", saas_atividades_router)
api.add_router("/saas", saas_submissoes_router)
api.add_router("/saas", saas_responsaveis_router)
api.add_router("/saas", saas_analytics_router)
api.add_router("/app", mobile_meta_router)
api.add_router("/app", app_atividades_router)
api.add_router("/app", app_submissoes_router)
api.add_router("/app/responsavel", app_responsavel_router)
