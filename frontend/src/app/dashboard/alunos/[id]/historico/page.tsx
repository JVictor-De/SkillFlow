"use client";

import { useEffect } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/dashboard/states";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { getHistoricoAluno } from "@/lib/services";
import { mockAlunos } from "@/lib/mocks";

export default function HistoricoAlunoPage({
  params,
}: {
  params: { id: string };
}) {
  const historico = useAsync(getHistoricoAluno);
  const alunoId = Number(params.id);
  const aluno = mockAlunos.find((a) => a.id === alunoId);

  useEffect(() => {
    historico.run(alunoId).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Histórico — ${aluno?.nome ?? "Aluno"}`}
        description="Timeline cross-turma de submissões. Disponível apenas para coordenadores."
      />

      {historico.loading && <ListSkeleton rows={3} />}
      {historico.error && <ErrorState description={historico.error} />}
      {historico.data && historico.data.length === 0 && (
        <EmptyState
          title="Sem submissões"
          description="Este aluno ainda não enviou nenhuma resposta."
        />
      )}
      {historico.data && historico.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historico.data.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-xs text-white">
                  {s.exercicio_ordem || "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {s.atividade_titulo}
                    </span>
                    <Badge variant="secondary">{s.turma_nome}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Tipo {s.atividade_tipo} · Status {s.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Nota final
                  </div>
                  <div className="text-base font-semibold">
                    {s.nota_final ?? "—"}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
