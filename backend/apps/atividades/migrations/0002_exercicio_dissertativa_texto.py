"""Add the third exercise type (DISSERTATIVA_TEXTO) and broaden the
`ex_alternativas_consistentes` check constraint to accept it.

We keep the legacy `DISSERTATIVA` value (it now represents the
PDF-attachment branch in the UI) so existing rows remain valid. The
new value `DISSERTATIVA_TEXTO` represents the free-text answer typed
on the platform — the third question type required by the product.
"""
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("atividades", "0001_initial"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="exercicio",
            name="ex_alternativas_consistentes",
        ),
        migrations.AlterField(
            model_name="exercicio",
            name="tipo",
            field=models.CharField(
                choices=[
                    ("MULTIPLA_ESCOLHA", "Múltipla escolha"),
                    ("DISSERTATIVA_TEXTO", "Dissertativa (texto)"),
                    ("DISSERTATIVA", "Anexo (PDF)"),
                ],
                max_length=20,
            ),
        ),
        migrations.AddConstraint(
            model_name="exercicio",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    models.Q(
                        ("alternativas__isnull", False),
                        ("tipo", "MULTIPLA_ESCOLHA"),
                    ),
                    models.Q(
                        ("alternativas__isnull", True),
                        ("tipo", "DISSERTATIVA"),
                    ),
                    models.Q(
                        ("alternativas__isnull", True),
                        ("tipo", "DISSERTATIVA_TEXTO"),
                    ),
                    _connector="OR",
                ),
                name="ex_alternativas_consistentes",
            ),
        ),
    ]
