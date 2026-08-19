"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Lock,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  ErrorState,
  LoadingState,
} from "@/components/dashboard/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsync } from "@/hooks/use-async";
import {
  aprovarAgendar,
  excluirAtividade,
  fecharAtividade,
  getAtividade,
} from "@/lib/services";
import { formatDateTime } from "@/lib/utils";
import type { ExercicioTipo } from "@/types";

export const TIPO_LABEL: Record<ExercicioTipo, string> = {
  MULTIPLA_ESCOLHA: "Múltipla escolha",
  DISSERTATIVA_TEXTO: "Dissertativa (texto)",
  DISSERTATIVA: "Anexo (PDF)",
};

export function AtividadeDetalhe({ atividadeId }: { atividadeId: number }) {
  const router = useRouter();
  const atividade = useAsync(getAtividade);
  const aprovar = useAsync(aprovarAgendar);
  const fechar = useAsync(fecharAtividade);
  const excluir = useAsync(excluirAtividade);
  const [dataLib, setDataLib] = useState("");
  const [dataLim, setDataLim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "fechar" | "excluir" | null
  >(null);

  useEffect(() => {
    atividade.run(atividadeId).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atividadeId]);

  if (atividade.loading) return <LoadingState title="Carregando atividade..." />;
  if (atividade.error) return <ErrorState description={atividade.error} />;
  if (!atividade.data) return null;

  const a = atividade.data;
  const isDraft = a.status_publicacao === "DRAFT";
  const isPublicado = a.status_publicacao === "PUBLICADO";
  const isProva = a.tipo_atividade === "PROVA";
  const dataLimite = a.data_limite ? new Date(a.data_limite) : null;
  const isFechada = !!(dataLimite && dataLimite.getTime() <= Date.now());

  async function handleAprovar() {
    setError(null);
    setSuccess(null);
    if (!dataLib || !dataLim) {
      setError(
        "Para publicar/agendar uma atividade, defina data de liberação e data limite.",
      );
      return;
    }
    const status = new Date(dataLib) > new Date() ? "AGENDADO" : "PUBLICADO";
    try {
      await aprovar.run(a.id, dataLib, dataLim, status);
      atividade.run(a.id);
      setSuccess("Datas aplicadas com sucesso.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleFechar() {
    setError(null);
    setSuccess(null);
    try {
      await fechar.run(a.id);
      await atividade.run(a.id);
      setConfirmAction(null);
      setSuccess(
        isProva
          ? "Prova fechada — novas respostas não serão aceitas."
          : "Atividade fechada.",
      );
    } catch (err) {
      setError((err as Error).message);
      setConfirmAction(null);
    }
  }

  async function handleExcluir() {
    setError(null);
    setSuccess(null);
    try {
      // O backend retorna 409 quando a atividade publicada já tem
      // submissões. Como o professor confirmou explicitamente, repetimos
      // com `force=true` para apagar em cascata os exercícios e
      // submissões — comportamento esperado quando ele clica em
      // "Sim, excluir" no diálogo de confirmação.
      try {
        await excluir.run(a.id);
      } catch (err) {
        const message = (err as Error).message ?? "";
        if (/submiss/i.test(message)) {
          await excluir.run(a.id, { force: true });
        } else {
          throw err;
        }
      }
      router.replace("/dashboard/atividades");
    } catch (err) {
      setError((err as Error).message);
      setConfirmAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/atividades" className="gap-1">
          <ArrowLeft size={14} /> Atividades
        </Link>
      </Button>

      <PageHeader
        title={a.titulo}
        description={`${a.disciplina} · ${a.turma_nome}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={a.tipo_atividade === "PROVA" ? "default" : "secondary"}
            >
              {a.tipo_atividade === "PROVA"
                ? `Prova · peso ${a.peso}`
                : "Exercício · peso 1"}
            </Badge>
            <Badge
              variant={
                a.status_publicacao === "PUBLICADO"
                  ? isFechada
                    ? "muted"
                    : "success"
                  : a.status_publicacao === "AGENDADO"
                    ? "warning"
                    : "muted"
              }
            >
              {a.status_publicacao}
              {isFechada && isPublicado ? " · Fechada" : ""}
            </Badge>

            {!isDraft && !isFechada && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setConfirmAction("fechar");
                  setError(null);
                  setSuccess(null);
                }}
                disabled={fechar.loading}
                data-testid="atividade-fechar"
              >
                <Lock size={14} />
                {isProva ? "Fechar prova" : "Fechar atividade"}
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirmAction("excluir");
                setError(null);
                setSuccess(null);
              }}
              disabled={excluir.loading}
              data-testid="atividade-excluir"
            >
              <Trash2 size={14} />
              Excluir
            </Button>
          </div>
        }
      />

      {confirmAction && (
        <ConfirmDialog
          loading={
            confirmAction === "fechar" ? fechar.loading : excluir.loading
          }
          title={
            confirmAction === "fechar"
              ? isProva
                ? "Fechar a prova para novas respostas?"
                : "Fechar a atividade para novas respostas?"
              : "Excluir esta atividade?"
          }
          description={
            confirmAction === "fechar"
              ? "A data limite será movida para o instante atual. Submissões já enviadas continuam disponíveis e correções não são afetadas."
              : "Esta ação é permanente. Exercícios e submissões existentes serão removidos. Tem certeza que deseja continuar?"
          }
          confirmLabel={
            confirmAction === "fechar" ? "Sim, fechar" : "Sim, excluir"
          }
          confirmVariant={confirmAction === "excluir" ? "destructive" : "default"}
          onCancel={() => setConfirmAction(null)}
          onConfirm={
            confirmAction === "fechar" ? handleFechar : handleExcluir
          }
        />
      )}

      {(error || aprovar.error || fechar.error || excluir.error) && (
        <Alert variant="destructive">
          <AlertDescription>
            {error ?? aprovar.error ?? fechar.error ?? excluir.error}
          </AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Liberação
            </div>
            <div className="mt-1 text-sm">
              {formatDateTime(a.data_liberacao)}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Limite
            </div>
            <div className="mt-1 text-sm">{formatDateTime(a.data_limite)}</div>
          </div>
        </CardContent>
      </Card>

      {isDraft && (
        <Card>
          <CardHeader>
            <CardTitle>Aprovar / Agendar</CardTitle>
            <p className="text-sm text-muted-foreground">
              Defina datas para publicar ou agendar esta atividade.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="data_liberacao">Data de liberação</Label>
              <Input
                id="data_liberacao"
                type="datetime-local"
                value={dataLib}
                onChange={(e) => setDataLib(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_limite">Data limite</Label>
              <Input
                id="data_limite"
                type="datetime-local"
                value={dataLim}
                onChange={(e) => setDataLim(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleAprovar} disabled={aprovar.loading}>
                {aprovar.loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Publicar / Agendar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exercícios ({a.exercicios.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {a.exercicios.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Esta atividade ainda não tem exercícios cadastrados.
            </p>
          )}
          {a.exercicios.map((ex) => (
            <div
              key={ex.id ?? ex.ordem}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Questão {ex.ordem}</Badge>
                <span className="text-xs text-muted-foreground">
                  {TIPO_LABEL[ex.tipo as ExercicioTipo] ?? ex.tipo}
                </span>
              </div>
              <p className="mt-2 text-sm text-foreground/90">{ex.enunciado}</p>
              {ex.alternativas && (
                <ul className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                  {ex.alternativas.map((alt) => (
                    <li key={alt.letra}>
                      <span className="font-medium text-foreground">
                        {alt.letra}.
                      </span>{" "}
                      {alt.texto}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {!isDraft && (
        <Card>
          <CardHeader>
            <CardTitle>Status na turma</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visão consolidada das submissões já recebidas.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Stat
                label="Alunos"
                value={a.total_alunos ?? 0}
                icon={<CalendarClock size={14} />}
              />
              <Stat
                label="Submissões"
                value={a.total_submissoes ?? 0}
                icon={<Send size={14} />}
              />
              <Stat
                label="Pendentes"
                value={(a.total_alunos ?? 0) - (a.total_submissoes ?? 0)}
                icon={<CalendarClock size={14} />}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4"
      data-testid="confirm-dialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c14] p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle size={18} />
          <h2 id="confirm-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
        </div>
        <p
          id="confirm-desc"
          className="mt-3 text-sm text-white/70"
        >
          {description}
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-button"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
