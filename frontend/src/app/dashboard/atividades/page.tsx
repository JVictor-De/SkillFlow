"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Plus } from "lucide-react";

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
import { listAtividades } from "@/lib/services";
import { formatDateTime } from "@/lib/utils";

export default function AtividadesPage() {
  const atividades = useAsync(listAtividades);

  useEffect(() => {
    atividades.run().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atividades"
        description="Crie, agende e revise atividades das suas turmas."
        actions={
          <Button asChild>
            <Link href="/dashboard/atividades/nova">
              <Plus size={14} /> Nova atividade
            </Link>
          </Button>
        }
      />

      {atividades.loading && <ListSkeleton rows={3} />}
      {atividades.error && <ErrorState description={atividades.error} />}
      {atividades.data && atividades.data.length === 0 && (
        <EmptyState
          title="Sem atividades cadastradas"
          description="Comece criando sua primeira atividade. Você pode usar IA para gerar exercícios em segundos."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/atividades/nova">
                <Plus size={14} /> Nova atividade
              </Link>
            </Button>
          }
        />
      )}

      {atividades.data && atividades.data.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {atividades.data.map((a) => (
            <Card key={a.id} className="hover:border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle>
                      <Link
                        href={`/dashboard/atividades/${a.id}`}
                        className="hover:text-foreground"
                      >
                        {a.titulo}
                      </Link>
                    </CardTitle>
                    <CardDescription className="truncate">
                      {a.disciplina} · {a.turma_nome}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      a.tipo_atividade === "PROVA" ? "default" : "secondary"
                    }
                  >
                    {a.tipo_atividade === "PROVA"
                      ? `Prova · peso ${a.peso}`
                      : "Exercício"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {a.status_publicacao === "DRAFT"
                      ? "Rascunho"
                      : `Liberado em ${formatDateTime(a.data_liberacao)}`}
                  </span>
                  <Badge
                    variant={
                      a.status_publicacao === "PUBLICADO"
                        ? "success"
                        : a.status_publicacao === "AGENDADO"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {a.status_publicacao}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
