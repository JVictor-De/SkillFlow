"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/dashboard/states";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { useAsync } from "@/hooks/use-async";
import { getAnalytics, listTurmas } from "@/lib/services";
import { ErrorChart } from "@/features/analytics/error-chart";
import { DisciplineChart } from "@/features/analytics/discipline-chart";

export default function AnalyticsPage() {
  const turmas = useAsync(listTurmas);
  const analytics = useAsync(getAnalytics);
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    turmas
      .run()
      .then((list) => {
        if (list.length > 0) setTurmaId(list[0].id);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (turmaId) analytics.run(turmaId).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Tendências de erros, médias por disciplina e alunos em risco."
      />

      <Card>
        <CardContent className="grid gap-3 p-6 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="turma">Turma</Label>
            <NativeSelect
              id="turma"
              value={turmaId ?? ""}
              onChange={(e) => setTurmaId(Number(e.target.value))}
            >
              <option value="">Selecione</option>
              {turmas.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipo">Filtro por tipo</Label>
            <NativeSelect
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Todas atividades</option>
              <option value="EXERCICIO">Exercícios</option>
              <option value="PROVA">Provas</option>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      {analytics.loading && <LoadingState title="Calculando analytics..." />}
      {analytics.error && <ErrorState description={analytics.error} />}
      {!analytics.loading && !analytics.error && !analytics.data && (
        <EmptyState
          title="Selecione uma turma"
          description="Escolha uma turma para visualizar os indicadores."
        />
      )}

      {analytics.data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Erros mais frequentes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Categorização semântica dada pela IA durante a correção.
              </p>
            </CardHeader>
            <CardContent>
              <ErrorChart data={analytics.data.por_categoria_erro} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Média por disciplina</CardTitle>
              <p className="text-sm text-muted-foreground">
                Atividades publicadas e corrigidas no período.
              </p>
            </CardHeader>
            <CardContent>
              <DisciplineChart data={analytics.data.por_disciplina} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Alunos em risco</CardTitle>
              <p className="text-sm text-muted-foreground">
                Alunos com média geral abaixo de 60.
              </p>
            </CardHeader>
            <CardContent>
              {analytics.data.alunos_em_risco.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum aluno em risco. 🎉
                </p>
              ) : (
                <ul className="grid gap-2 md:grid-cols-2">
                  {analytics.data.alunos_em_risco.map((al) => (
                    <li
                      key={al.aluno_id}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <span className="text-sm">{al.aluno_nome}</span>
                      <Badge variant="destructive">Média {al.media}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
