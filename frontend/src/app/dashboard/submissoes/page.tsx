"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorState, ListSkeleton } from "@/components/dashboard/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAsync } from "@/hooks/use-async";
import { listSubmissoes, listTurmas } from "@/lib/services";
import type { SubmissaoStatus } from "@/types";

const STATUS_LABELS: Record<SubmissaoStatus, string> = {
  PENDENTE: "Pendente",
  EM_PROCESSAMENTO: "Em processamento",
  CORRIGIDA: "Corrigida",
  REVISADA_PROFESSOR: "Revisada",
  CONFLITO_SYNC: "Conflito sync",
};

const STATUS_VARIANT: Record<
  SubmissaoStatus,
  "default" | "secondary" | "warning" | "success" | "destructive" | "muted"
> = {
  PENDENTE: "warning",
  EM_PROCESSAMENTO: "secondary",
  CORRIGIDA: "success",
  REVISADA_PROFESSOR: "default",
  CONFLITO_SYNC: "destructive",
};

export default function SubmissoesPage() {
  const submissoes = useAsync(listSubmissoes);
  const turmas = useAsync(listTurmas);
  const [turmaId, setTurmaId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");

  useEffect(() => {
    turmas.run().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    submissoes
      .run({
        turma_id: turmaId ? Number(turmaId) : undefined,
        status: status || undefined,
        tipo: tipo || undefined,
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, status, tipo]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissões"
        description="Acompanhe correções, dê override de notas e resolva conflitos de sync."
      />

      <Card>
        <CardContent className="grid gap-3 p-6 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="turma">Turma</Label>
            <NativeSelect
              id="turma"
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
            >
              <option value="">Todas</option>
              {turmas.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <NativeSelect
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipo">Tipo da atividade</Label>
            <NativeSelect
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="EXERCICIO">Exercício</option>
              <option value="PROVA">Prova</option>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      {submissoes.loading && <ListSkeleton rows={3} />}
      {submissoes.error && <ErrorState description={submissoes.error} />}

      {submissoes.data && submissoes.data.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <Th>Aluno</Th>
                  <Th>Atividade</Th>
                  <Th>Tipo Ativ.</Th>
                  <Th>Exercício</Th>
                  <Th>Tipo Q.</Th>
                  <Th>Nota IA</Th>
                  <Th>Nota final</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {submissoes.data.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <Td>{s.aluno_nome}</Td>
                    <Td>{s.atividade_titulo}</Td>
                    <Td>
                      <Badge
                        variant={
                          s.atividade_tipo === "PROVA" ? "default" : "secondary"
                        }
                      >
                        {s.atividade_tipo === "PROVA" ? "Prova" : "Exercício"}
                      </Badge>
                    </Td>
                    <Td>#{s.exercicio_ordem}</Td>
                    <Td>
                      {s.exercicio_tipo === "MULTIPLA_ESCOLHA"
                        ? "MC"
                        : "Dissert."}
                    </Td>
                    <Td>{s.nota_calculada ?? "—"}</Td>
                    <Td className="font-medium">{s.nota_final ?? "—"}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[s.status]}>
                        {STATUS_LABELS[s.status]}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/dashboard/submissoes/${s.id}`}
                        className="text-brand-300 hover:underline"
                      >
                        abrir
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={"px-4 py-3 align-middle " + (className ?? "")}>
      {children}
    </td>
  );
}
