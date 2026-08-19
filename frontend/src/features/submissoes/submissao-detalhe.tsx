"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Loader2, Save, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
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
import { Textarea } from "@/components/ui/textarea";
import { useAsync } from "@/hooks/use-async";
import { getSubmissao, overrideNota } from "@/lib/services";
import type { SubmissaoDetalhe } from "@/types";

export function SubmissaoDetalheView({ submissaoId }: { submissaoId: number }) {
  const submissao = useAsync(getSubmissao);
  const override = useAsync(overrideNota);
  const [nota, setNota] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    submissao.run(submissaoId).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissaoId]);

  useEffect(() => {
    if (submissao.data) {
      setNota(submissao.data.nota_professor_override?.toString() ?? "");
      setFeedback(submissao.data.feedback_professor ?? "");
    }
  }, [submissao.data]);

  if (submissao.loading) return <LoadingState title="Carregando submissão..." />;
  if (submissao.error) return <ErrorState description={submissao.error} />;
  if (!submissao.data) return null;

  const s = submissao.data;

  async function handleOverride() {
    setSuccess(false);
    try {
      const value: { nota?: number; feedback?: string } = {};
      if (nota !== "") value.nota = Number(nota);
      if (feedback) value.feedback = feedback;
      await override.run(s.id, value);
      setSuccess(true);
    } catch {
      /* tratado pelo hook */
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/submissoes" className="gap-1">
          <ArrowLeft size={14} /> Submissões
        </Link>
      </Button>

      <PageHeader
        title={`Submissão de ${s.aluno_nome}`}
        description={`${s.atividade_titulo} · Questão ${s.exercicio_ordem}`}
        actions={
          <Badge variant="secondary">
            {s.exercicio_tipo === "MULTIPLA_ESCOLHA"
              ? "Múltipla escolha"
              : s.exercicio_tipo === "DISSERTATIVA_TEXTO"
                ? "Dissertativa (texto)"
                : "Anexo (PDF)"}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enunciado e gabarito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                Enunciado
              </h3>
              <p className="mt-1 text-foreground/90">{s.enunciado}</p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                Gabarito
              </h3>
              <p className="mt-1 text-foreground/80">{s.gabarito}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resposta do aluno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {s.resposta_texto && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="whitespace-pre-wrap">{s.resposta_texto}</p>
              </div>
            )}
            {s.pdf_url && (
              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/10 text-brand-300">
                  <FileText size={18} />
                </div>
                <div className="text-sm">
                  <div className="font-medium">PDF do aluno</div>
                  <a
                    href={s.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-300 hover:underline"
                  >
                    Abrir em nova aba
                  </a>
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <Stat
                label="Nota calculada"
                value={s.nota_calculada !== null ? `${s.nota_calculada}` : "—"}
              />
              <Stat
                label="Nota final"
                value={s.nota_final !== null ? `${s.nota_final}` : "—"}
                highlight
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand-300" />
            <CardTitle>Feedback gerado pela IA</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-foreground/80">
          {feedbackIaPlaceholder(s)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Override da nota e feedback</CardTitle>
          <p className="text-sm text-muted-foreground">
            Salvar atualiza para status REVISADA_PROFESSOR e prevalece sobre a
            nota da IA.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="nota">Nota (0 a 100)</Label>
              <Input
                id="nota"
                type="number"
                min={0}
                max={100}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="feedback">Feedback do professor</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Mensagem que será exibida ao aluno"
              />
            </div>
          </div>

          {override.error && (
            <Alert variant="destructive">
              <AlertDescription>{override.error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="success">
              <AlertDescription>Override salvo com sucesso.</AlertDescription>
            </Alert>
          )}
          <Button onClick={handleOverride} disabled={override.loading}>
            {override.loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar override
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Mensagem contextual para o card de feedback IA.
 *
 * Antes mostrávamos "Sem feedback automático ainda." em qualquer
 * submissão sem `feedback_ia`. Isso confundia o professor em casos
 * legítimos de pipeline assíncrono (dissertativa em correção, conflito
 * de sync). Agora explicitamos o estado real para que ele saiba se
 * cabe esperar mais alguns segundos ou intervir manualmente.
 */
function feedbackIaPlaceholder(
  s: Pick<
    SubmissaoDetalhe,
    "feedback_ia" | "status" | "exercicio_tipo"
  >,
): string {
  if (s.feedback_ia) return s.feedback_ia;
  switch (s.status) {
    case "PENDENTE":
    case "EM_PROCESSAMENTO":
      return "Em correção pela IA — atualize esta página em alguns segundos.";
    case "CONFLITO_SYNC":
      return "Submissão em conflito de sincronização. Resolva o conflito antes da correção automática.";
    case "REVISADA_PROFESSOR":
      if (s.exercicio_tipo === "MULTIPLA_ESCOLHA") {
        return "Resposta corrigida automaticamente. Override manual prevalece.";
      }
      if (s.exercicio_tipo === "DISSERTATIVA_TEXTO") {
        return "Resposta dissertativa em texto sem retorno automático — utilize o feedback do professor abaixo.";
      }
      return "Sem feedback automático — utilize o feedback do professor abaixo.";
    default:
      return "Sem feedback automático ainda.";
  }
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-semibold ${highlight ? "text-gradient" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
