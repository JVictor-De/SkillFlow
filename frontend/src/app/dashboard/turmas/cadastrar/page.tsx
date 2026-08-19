"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

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
import { useAsync } from "@/hooks/use-async";
import { cadastrarTurma } from "@/lib/services";

export default function CadastrarTurmaPage() {
  const router = useRouter();
  const cadastrar = useAsync(cadastrarTurma);
  const [nome, setNome] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) return;
    try {
      await cadastrar.run({ nome: trimmed });
      setNome("");
      router.push("/dashboard/turmas");
    } catch {
      /* tratado pelo hook */
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/turmas" className="gap-1">
          <ArrowLeft size={14} /> Todas as turmas
        </Link>
      </Button>

      <PageHeader
        title="Cadastrar turma"
        description="Crie uma nova turma vinculada à sua escola. Após o cadastro ela ficará disponível para vincular alunos e criar atividades."
      />

      <Card>
        <CardHeader>
          <CardTitle>Nova turma</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da turma</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: 9º Ano A"
                required
                autoFocus
              />
            </div>

            {cadastrar.error && (
              <Alert variant="destructive">
                <AlertDescription>{cadastrar.error}</AlertDescription>
              </Alert>
            )}

            {cadastrar.data && (
              <Alert variant="success">
                <AlertDescription>
                  <CheckCircle2 size={14} className="mr-1 inline" />
                  Turma {cadastrar.data.nome} criada.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={cadastrar.loading}>
                {cadastrar.loading && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Criar turma
              </Button>
              <Button asChild variant="ghost" type="button">
                <Link href="/dashboard/turmas">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
