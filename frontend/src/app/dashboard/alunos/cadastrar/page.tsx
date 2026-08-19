"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useAsync } from "@/hooks/use-async";
import { cadastrarAluno, listTurmas } from "@/lib/services";

export default function CadastrarAlunoPage() {
  const turmas = useAsync(listTurmas);
  const cadastrar = useAsync(cadastrarAluno);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [turmaId, setTurmaId] = useState<number | null>(null);

  useEffect(() => {
    turmas.run().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!turmaId) return;
    try {
      await cadastrar.run(turmaId, { nome, email });
      setNome("");
      setEmail("");
    } catch {
      /* tratado pelo hook */
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastrar aluno"
        description="Crie a conta do aluno. Uma senha provisória será gerada automaticamente."
      />

      <Card>
        <CardHeader>
          <CardTitle>Novo aluno</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                    {t.nome}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {cadastrar.error && (
              <Alert variant="destructive" className="md:col-span-2">
                <AlertDescription>{cadastrar.error}</AlertDescription>
              </Alert>
            )}

            {cadastrar.data && (
              <Alert variant="success" className="md:col-span-2">
                <AlertDescription className="space-y-1">
                  <p>
                    <CheckCircle2 size={14} className="mr-1 inline" />
                    Aluno {cadastrar.data.aluno.nome} criado.
                  </p>
                  <p>
                    Senha provisória:{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5">
                      {cadastrar.data.senha_provisoria}
                    </code>
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="md:col-span-2">
              <Button type="submit" disabled={cadastrar.loading}>
                {cadastrar.loading && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Criar aluno
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
