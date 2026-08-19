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
import { listProfessores } from "@/lib/services";

export default function ProfessoresPage() {
  const professores = useAsync(listProfessores);

  useEffect(() => {
    professores.run().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Professores"
        description="Cadastre, vincule e gerencie professores da escola."
        actions={
          <Button>
            <Plus size={14} /> Cadastrar professor
          </Button>
        }
      />

      {professores.loading && <ListSkeleton rows={3} />}
      {professores.error && <ErrorState description={professores.error} />}

      {professores.data && (
        <div className="grid gap-3 md:grid-cols-2">
          {professores.data.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.nome}</CardTitle>
                <CardDescription>{p.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Turmas vinculadas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.turmas.map((t) => (
                    <Badge key={t.id} variant="secondary">
                      {t.nome}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm">
                    Vincular turma
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
