"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorState, ListSkeleton } from "@/components/dashboard/states";
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
import { listResponsaveis } from "@/lib/services";

export default function ResponsaveisPage() {
  const responsaveis = useAsync(listResponsaveis);

  useEffect(() => {
    responsaveis.run().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Responsáveis"
        description="Cadastre responsáveis e vincule aos alunos da escola."
        actions={
          <Button>
            <Plus size={14} /> Cadastrar responsável
          </Button>
        }
      />

      {responsaveis.loading && <ListSkeleton rows={3} />}
      {responsaveis.error && <ErrorState description={responsaveis.error} />}

      {responsaveis.data && (
        <div className="grid gap-3 md:grid-cols-2">
          {responsaveis.data.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle>{r.nome}</CardTitle>
                <CardDescription>{r.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Filhos vinculados
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.alunos.map((al) => (
                    <Badge key={al.id} variant="secondary">
                      {al.nome} · {al.turma_nome}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm">
                    Vincular aluno
                  </Button>
                  <Button variant="ghost" size="sm">
                    Desvincular
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
