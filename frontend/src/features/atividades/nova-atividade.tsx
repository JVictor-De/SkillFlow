"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

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
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAsync } from "@/hooks/use-async";
import {
  CreateAtividadeInput,
  createAtividade,
  listTurmas,
} from "@/lib/services";
import type { Exercicio } from "@/types";

interface NovaAtividadeProps {
  turmaInicial?: number;
}

/**
 * Esses três tipos casam com a enum `Exercicio.Tipo` no backend
 * (`MULTIPLA_ESCOLHA`, `DISSERTATIVA_TEXTO`, `DISSERTATIVA`). O label
 * usuário-final fica em pt-BR.
 */
const TIPO_OPTIONS: { value: Exercicio["tipo"]; label: string }[] = [
  { value: "MULTIPLA_ESCOLHA", label: "Múltipla escolha" },
  { value: "DISSERTATIVA_TEXTO", label: "Dissertativa (texto)" },
  { value: "DISSERTATIVA", label: "Anexo (PDF)" },
];

const empty: Exercicio = {
  ordem: 1,
  tipo: "MULTIPLA_ESCOLHA",
  enunciado: "",
  gabarito_esperado: "B",
  alternativas: [
    { letra: "A", texto: "" },
    { letra: "B", texto: "" },
    { letra: "C", texto: "" },
    { letra: "D", texto: "" },
    { letra: "E", texto: "" },
  ],
};

export function NovaAtividade({ turmaInicial }: NovaAtividadeProps) {
  const router = useRouter();
  const turmas = useAsync(listTurmas);
  const create = useAsync(createAtividade);

  const [titulo, setTitulo] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [tipo, setTipo] = useState<"EXERCICIO" | "PROVA">("EXERCICIO");
  const [peso, setPeso] = useState<number>(1);
  const [turmaId, setTurmaId] = useState<number | undefined>(turmaInicial);
  const [dataLiberacao, setDataLiberacao] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [aiGen, setAiGen] = useState(false);
  const [exercicios, setExercicios] = useState<Exercicio[]>([{ ...empty }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    turmas.run().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(idx: number, patch: Partial<Exercicio>) {
    setExercicios((prev) =>
      prev.map((ex, i) => {
        if (i !== idx) return ex;
        const nextTipo = patch.tipo ?? ex.tipo;
        const proximaIsMC = nextTipo === "MULTIPLA_ESCOLHA";
        return {
          ...ex,
          ...patch,
          // Apenas múltipla escolha mantém alternativas; dissertativas
          // (texto e anexo) sempre zeram esse campo.
          alternativas: proximaIsMC
            ? (patch.alternativas ?? ex.alternativas ?? empty.alternativas)
            : null,
        };
      }),
    );
  }

  function addExercicio() {
    setExercicios((prev) => [
      ...prev,
      {
        ...empty,
        ordem: prev.length + 1,
      },
    ]);
  }

  function removeExercicio(idx: number) {
    setExercicios((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((ex, i) => ({ ...ex, ordem: i + 1 })),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!turmaId) {
      setError("Selecione uma turma.");
      return;
    }
    if (tipo === "PROVA" && (!peso || peso < 1)) {
      setError("Peso da prova deve ser >= 1.");
      return;
    }
    const payload: CreateAtividadeInput = {
      titulo,
      disciplina,
      turma_id: turmaId,
      tipo_atividade: tipo,
      peso: tipo === "EXERCICIO" ? 1 : peso,
      data_liberacao: dataLiberacao || null,
      data_limite: dataLimite || null,
      exercicios,
    };
    try {
      const novo = await create.run(payload);
      router.replace(`/dashboard/atividades/${novo.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (turmas.loading) return <LoadingState title="Carregando turmas..." />;
  if (turmas.error) return <ErrorState description={turmas.error} />;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PageHeader
        title="Nova atividade"
        description="Configure os dados gerais e os exercícios desta atividade."
        actions={
          <Button type="submit" disabled={create.loading}>
            {create.loading && <Loader2 size={16} className="animate-spin" />}
            Salvar como rascunho
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informações gerais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Revolução Industrial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disciplina">Disciplina</Label>
            <Input
              id="disciplina"
              required
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              placeholder="História"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="turma">Turma</Label>
            <NativeSelect
              id="turma"
              required
              value={turmaId ?? ""}
              onChange={(e) => setTurmaId(Number(e.target.value))}
            >
              <option value="">Selecione...</option>
              {turmas.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} — {t.escola_nome}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo da atividade</Label>
            <NativeSelect
              id="tipo"
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value as "EXERCICIO" | "PROVA")
              }
            >
              <option value="EXERCICIO">Exercício</option>
              <option value="PROVA">Prova</option>
            </NativeSelect>
          </div>

          {tipo === "PROVA" && (
            <div className="space-y-2">
              <Label htmlFor="peso">Peso da prova</Label>
              <Input
                id="peso"
                type="number"
                min={1}
                value={peso}
                onChange={(e) => setPeso(Number(e.target.value))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="data_liberacao">
              Data de liberação{" "}
              <span className="text-xs text-muted-foreground">
                (opcional em rascunho)
              </span>
            </Label>
            <Input
              id="data_liberacao"
              type="datetime-local"
              value={dataLiberacao}
              onChange={(e) => setDataLiberacao(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_limite">
              Data limite{" "}
              <span className="text-xs text-muted-foreground">
                (opcional em rascunho)
              </span>
            </Label>
            <Input
              id="data_limite"
              type="datetime-local"
              value={dataLimite}
              onChange={(e) => setDataLimite(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Exercícios</CardTitle>
            <p className="text-xs text-muted-foreground">
              Combine os 3 tipos: múltipla escolha, dissertativa em texto e
              anexo PDF.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAiGen((v) => !v)}
            >
              <Sparkles size={14} /> Gerar com IA
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addExercicio}
            >
              <Plus size={14} /> Adicionar exercício
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiGen && (
            <Alert variant="default">
              <AlertDescription>
                Em produção este painel abre o fluxo de geração com material da
                turma + IA (RAG). Os exercícios gerados ficam em rascunho para
                revisão. Por enquanto, configure os exercícios manualmente.
              </AlertDescription>
            </Alert>
          )}

          {exercicios.map((ex, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge>Exercício {idx + 1}</Badge>
                  <Badge variant="muted">
                    {
                      TIPO_OPTIONS.find((opt) => opt.value === ex.tipo)
                        ?.label ?? ex.tipo
                    }
                  </Badge>
                </div>
                {exercicios.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExercicio(idx)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`tipo-${idx}`}>Tipo</Label>
                    <NativeSelect
                      id={`tipo-${idx}`}
                      value={ex.tipo}
                      onChange={(e) => {
                        const novoTipo = e.target.value as Exercicio["tipo"];
                        update(idx, {
                          tipo: novoTipo,
                          alternativas:
                            novoTipo === "MULTIPLA_ESCOLHA"
                              ? empty.alternativas
                              : null,
                          gabarito_esperado:
                            novoTipo === "MULTIPLA_ESCOLHA" ? "B" : "",
                        });
                      }}
                    >
                      {TIPO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect>
                    <p className="text-xs text-muted-foreground">
                      {gabaritoHint(ex.tipo)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`gab-${idx}`}>
                      Gabarito {ex.tipo === "MULTIPLA_ESCOLHA" ? "(A-E)" : ""}
                    </Label>
                    {ex.tipo === "MULTIPLA_ESCOLHA" ? (
                      <NativeSelect
                        id={`gab-${idx}`}
                        value={ex.gabarito_esperado}
                        onChange={(e) =>
                          update(idx, { gabarito_esperado: e.target.value })
                        }
                      >
                        {["A", "B", "C", "D", "E"].map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </NativeSelect>
                    ) : (
                      <Input
                        id={`gab-${idx}`}
                        value={ex.gabarito_esperado}
                        onChange={(e) =>
                          update(idx, { gabarito_esperado: e.target.value })
                        }
                        placeholder={
                          ex.tipo === "DISSERTATIVA_TEXTO"
                            ? "Critérios para correção do texto"
                            : "Critérios para correção do PDF"
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`enun-${idx}`}>Enunciado</Label>
                  <Textarea
                    id={`enun-${idx}`}
                    value={ex.enunciado}
                    onChange={(e) =>
                      update(idx, { enunciado: e.target.value })
                    }
                    placeholder="Escreva o enunciado..."
                    required
                  />
                </div>

                {ex.tipo === "MULTIPLA_ESCOLHA" && ex.alternativas && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {ex.alternativas.map((alt, altIdx) => (
                      <div key={alt.letra} className="space-y-2">
                        <Label htmlFor={`alt-${idx}-${alt.letra}`}>
                          Alternativa {alt.letra}
                        </Label>
                        <Input
                          id={`alt-${idx}-${alt.letra}`}
                          value={alt.texto}
                          onChange={(e) =>
                            update(idx, {
                              alternativas: ex.alternativas?.map((a, j) =>
                                j === altIdx
                                  ? { ...a, texto: e.target.value }
                                  : a,
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

function gabaritoHint(tipo: Exercicio["tipo"]): string {
  switch (tipo) {
    case "MULTIPLA_ESCOLHA":
      return "O aluno responde escolhendo uma alternativa.";
    case "DISSERTATIVA_TEXTO":
      return "O aluno digita a resposta na própria plataforma.";
    case "DISSERTATIVA":
      return "O aluno anexa um PDF com a resposta.";
    default:
      return "";
  }
}
