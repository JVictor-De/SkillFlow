"""Celery entry-point and Beat schedule for SkillFlow."""
from __future__ import annotations

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("skillflow")
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover @shared_task definitions in Django apps and the tasks/ package.
app.autodiscover_tasks(packages=["tasks", "apps.atividades", "apps.submissoes"])

app.conf.beat_schedule = {
    "atualizar-atividades-agendadas": {
        # Drip-content publisher: every minute promote AGENDADO -> PUBLICADO.
        "task": "tasks.atividades.atualizar_atividades_agendadas",
        "schedule": 60.0,
    },
}


@app.task(bind=True)
def debug_task(self):  # pragma: no cover - utility
    print(f"Request: {self.request!r}")
