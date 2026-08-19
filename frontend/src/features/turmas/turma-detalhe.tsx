"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Plus,
  Trophy,
  Upload,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
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
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAsync } from "@/hooks/use-async";
import {
  getRankingTurma,
  getTurma,
  listAlunosTurma,
  listAtividades,
  listMateriaisTurma,
  setRanking,
  uploadMaterialTurma,
} from "@/lib/services";
import { formatDateTime } from "@/lib/utils";
import type { MaterialApoio } from "@/types";

export function TurmaDetalhe({ turmaId }: { turmaId: number }) {
  const turma = useAsync(getTurma);
  const alunos = useAsync(listAlunosTurma);
  const atividades = useAsync(listAtividades);
  const updateRanking = useAsync(setRanking);
  const ranking = useAsync(getRankingTurma);
  const materiais = useAsync(listMateriaisTurma);
  const upload = useAsync(uploadMaterialTurma);

  const [rankingTipo, setRankingTipo] = useState<"pontuacao" | "provas">(
    "pontuacao",
  );

  useEffect(() => {
    turma.run(turmaId).catch(() => undefined);
    alunos.run(turmaId).catch(() => undefined);
    atividades.run({ turma_id: turmaId }).catch(() => undefined);
    materiais.run(turmaId).catch(() => undefined);
    ranking.run(turmaId, "pontuacao").catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId]);

  async function toggleRanking(field: "pontuacao" | "provas", value: boolean) {
    if (!turma.data) return;
    const payload = {
      ranking_pontuacao_ativo:
        field === "pontuacao" ? value : turma.data.ranking_pontuacao_ativo,
      ranking_provas_ativo:
        field === "provas" ? value : turma.data.ranking_provas_ativo,
    };
    try {
      await updateRanking.run(turma.data.id, payload);
      await turma.run(turmaId);
    } catch {
      /* tratado pelo hook */
    }
  }

  function changeRankingTipo(tipo: "pontuacao" | "provas") {
    setRankingTipo(tipo);
    ranking.run(turmaId, tipo).catch(() => undefined);
  }

  async function handleUpload(payload: { titulo: string; file: File }) {
    await upload.run(turmaId, payload);
    await materiais.run(turmaId);
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/turmas" className="gap-1">
          <ArrowLeft size={14} /> Todas as turmas
        </Link>
      </Button>

      <PageHeader
        title={turma.data?.nome ?? "Turma"}
        description={turma.data?.escola_nome}
        actions={
          <Button asChild>
            <Link href={`/dashboard/atividades/nova?turma_id=${turmaId}`}>
              <Plus size={14} /> Nova atividade
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="alunos">
        <TabsList>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="alunos">
          {alunos.loading && <ListSkeleton rows={3} />}
          {alunos.error && <ErrorState description={alunos.error} />}
          {alunos.data && alunos.data.length === 0 && (
            <EmptyState
              title="Nenhum aluno cadastrado"
              description="Cadastre alunos individualmente ou via PDF para começar."
            />
          )}
          {alunos.data && alunos.data.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {alunos.data.map((aluno) => (
                <Card key={aluno.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {aluno.nome}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {aluno.email}
                        </p>
                      </div>
                      {aluno.media_geral !== null &&
                        aluno.media_geral !== undefined && (
                          <Badge
                            variant={
                              aluno.media_geral >= 70
                                ? "success"
                                : aluno.media_geral >= 50
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            Média {aluno.media_geral?.toFixed(0)}
                          </Badge>
                        )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="atividades">
          {atividades.loading && <ListSkeleton rows={3} />}
          {atividades.error && (
            <ErrorState description={atividades.error} />
          )}
          {atividades.data && atividades.data.length === 0 && (
            <EmptyState
              title="Sem atividades"
              description="Crie sua primeira atividade para esta turma."
              action={
                <Button asChild size="sm">
                  <Link href={`/dashboard/atividades/nova?turma_id=${turmaId}`}>
                    <Plus size={14} /> Nova atividade
                  </Link>
                </Button>
              }
            />
          )}
          {atividades.data && atividades.data.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {atividades.data.map((a) => (
                <Card key={a.id} className="hover:border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/dashboard/atividades/${a.id}`}
                          className="text-base font-semibold hover:text-foreground"
                        >
                          {a.titulo}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {a.disciplina} ·{" "}
                          {a.tipo_atividade === "PROVA"
                            ? `Prova · peso ${a.peso}`
                            : "Exercício"}
                        </p>
                      </div>
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
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Liberação: {formatDateTime(a.data_liberacao)}
                      </span>
                      <span>
                        Limite: {formatDateTime(a.data_limite)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="materiais">
          <MateriaisSection
            materiais={materiais.data}
            loading={materiais.loading}
            error={materiais.error}
            onUpload={handleUpload}
            uploadLoading={upload.loading}
            uploadError={upload.error}
          />
        </TabsContent>

        <TabsContent value="ranking">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-300" />
                  <CardTitle>Configurações de ranking</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Controle se os rankings aparecem para os alunos no app
                  mobile.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <RankingRow
                  label="Ranking de pontuação"
                  description="Soma das notas de todas as atividades da turma."
                  checked={turma.data?.ranking_pontuacao_ativo ?? false}
                  onChange={(v) => toggleRanking("pontuacao", v)}
                />
                <RankingRow
                  label="Ranking de provas"
                  description="Média ponderada apenas das atividades do tipo Prova."
                  checked={turma.data?.ranking_provas_ativo ?? false}
                  onChange={(v) => toggleRanking("provas", v)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Ranking atual</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Visão completa da turma — mesmo alunos sem nota
                      registrada aparecem (com pontuação 0) para você
                      acompanhar o engajamento.
                    </p>
                  </div>
                  <div
                    role="tablist"
                    aria-label="Tipo de ranking"
                    className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1"
                  >
                    {(
                      [
                        { id: "pontuacao", label: "Pontuação" },
                        { id: "provas", label: "Provas" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        role="tab"
                        aria-selected={rankingTipo === opt.id}
                        onClick={() => changeRankingTipo(opt.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          rankingTipo === opt.id
                            ? "bg-white/10 text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ranking.loading && <ListSkeleton rows={4} />}
                {ranking.error && (
                  <ErrorState description={ranking.error} />
                )}
                {ranking.data && ranking.data.itens?.length === 0 && (
                  <EmptyState
                    title="Sem alunos na turma"
                    description="Cadastre alunos para começar a calcular o ranking."
                  />
                )}
                {ranking.data &&
                  ranking.data.itens &&
                  ranking.data.itens.length > 0 && (
                    <ol
                      className="space-y-2"
                      aria-label="Posições do ranking"
                      data-testid="ranking-list"
                    >
                      {ranking.data.itens.map((item) => (
                        <li
                          key={item.aluno_id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold ${
                                item.posicao === 1
                                  ? "bg-amber-300/20 text-amber-200"
                                  : item.posicao === 2
                                    ? "bg-slate-300/15 text-slate-200"
                                    : item.posicao === 3
                                      ? "bg-orange-300/15 text-orange-200"
                                      : "bg-white/5 text-foreground"
                              }`}
                            >
                              {item.posicao}
                            </span>
                            <span className="truncate text-sm font-medium">
                              {item.aluno_nome}
                            </span>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">
                            {Number.isFinite(item.pontuacao)
                              ? item.pontuacao.toFixed(1)
                              : "0.0"}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RankingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

interface MateriaisSectionProps {
  materiais: MaterialApoio[] | null;
  loading: boolean;
  error: string | null;
  onUpload: (payload: { titulo: string; file: File }) => Promise<void>;
  uploadLoading: boolean;
  uploadError: string | null;
}

function MateriaisSection({
  materiais,
  loading,
  error,
  onUpload,
  uploadLoading,
  uploadError,
}: MateriaisSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function reset() {
    setTitulo("");
    setFile(null);
    setValidation(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setValidation("Envie um arquivo PDF.");
      setFile(null);
      return;
    }
    if (f && f.size > 50 * 1024 * 1024) {
      setValidation("PDF excede o limite de 50MB.");
      setFile(null);
      return;
    }
    setValidation(null);
    setFile(f);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(null);
    setValidation(null);
    if (!titulo.trim()) {
      setValidation("Informe um título para o material.");
      return;
    }
    if (!file) {
      setValidation("Selecione um PDF.");
      return;
    }
    try {
      await onUpload({ titulo: titulo.trim(), file });
      setSuccess(`Material "${titulo.trim()}" adicionado com sucesso.`);
      reset();
      setShowForm(false);
    } catch {
      /* tratado pelo hook do consumidor */
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Banco de materiais (PDF)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Apostilas e referências usadas para gerar exercícios via
                IA (RAG) e como apoio das aulas.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowForm((v) => !v);
                setSuccess(null);
              }}
              data-testid="material-toggle-form"
            >
              <Plus size={14} />
              {showForm ? "Cancelar" : "Adicionar material"}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              data-testid="material-form"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="material-titulo">Título</Label>
                  <Input
                    id="material-titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Apostila de funções"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material-arquivo">Arquivo (PDF)</Label>
                  <Input
                    id="material-arquivo"
                    type="file"
                    accept="application/pdf,.pdf"
                    ref={inputRef}
                    onChange={pickFile}
                    required
                  />
                </div>
              </div>
              {(validation || uploadError) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {validation ?? uploadError}
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    reset();
                    setShowForm(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={uploadLoading}
                  data-testid="material-submit"
                >
                  {uploadLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  Salvar material
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState description={error} />}
      {materiais && materiais.length === 0 && !loading && (
        <EmptyState
          title="Nenhum material enviado ainda"
          description="Envie apostilas em PDF para alimentar o RAG e gerar exercícios automaticamente."
        />
      )}
      {materiais && materiais.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {materiais.map((m) => (
            <Card key={m.id} className="hover:border-white/10">
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/10 text-brand-300">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={m.arquivo_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-semibold hover:text-foreground"
                  >
                    {m.titulo}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Enviado em {formatDateTime(m.criado_em)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
