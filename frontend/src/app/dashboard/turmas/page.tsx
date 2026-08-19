"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Plus, Trophy } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
} from "@/components/dashboard/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { listTurmas } from "@/lib/services";

export default function TurmasPage() {
  const turmas = useAsync(listTurmas);

  useEffect(() => {
    turmas.run().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Turmas"
        description="Gerencie suas turmas, alunos, atividades e ranking."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/dashboard/turmas/cadastrar">
                <Plus size={14} /> Cadastrar Turma
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/alunos/cadastrar">
                <Plus size={14} /> Cadastrar aluno
              </Link>
            </Button>
          </>
        }
      />

      {turmas.loading && <ListSkeleton rows={6} />}

      {turmas.error && (
        <ErrorState description={turmas.error} onRetry={() => turmas.run()} />
      )}

      {!turmas.loading && !turmas.error && turmas.data?.length === 0 && (
        <EmptyState
          title="Nenhuma turma encontrada"
          description="Você ainda não está vinculado a nenhuma turma. Solicite ao coordenador para vincular você."
        />
      )}

      {turmas.data && turmas.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {turmas.data.map((turma) => (
            <Card
              key={turma.id}
              className="group hover:border-white/10 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{turma.nome}</CardTitle>
                    <CardDescription>{turma.escola_nome}</CardDescription>
                  </div>
                  {(turma.ranking_pontuacao_ativo ||
                    turma.ranking_provas_ativo) && (
                    <Badge variant="secondary" className="gap-1">
                      <Trophy size={12} /> Ranking ativo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Alunos" value={turma.total_alunos} />
                  <Stat label="Atividades" value={turma.total_atividades} />
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant={
                        turma.ranking_pontuacao_ativo ? "success" : "muted"
                      }
                    >
                      Pontuação{" "}
                      {turma.ranking_pontuacao_ativo ? "on" : "off"}
                    </Badge>
                    <Badge
                      variant={
                        turma.ranking_provas_ativo ? "success" : "muted"
                      }
                    >
                      Provas {turma.ranking_provas_ativo ? "on" : "off"}
                    </Badge>
                  </div>

                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/dashboard/turmas/${turma.id}`}
                      className="gap-1"
                    >
                      Abrir
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
