"use client";

import { FormEvent, useEffect, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";

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
import { cadastrarMassa, listTurmas } from "@/lib/services";

const MAX_SIZE_MB = 10;

export default function CadastrarMassaPage() {
  const turmas = useAsync(listTurmas);
  const upload = useAsync(cadastrarMassa);
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    turmas.run().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!turmaId || !file) {
      setError("Selecione a turma e o PDF.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Arquivo excede o limite de ${MAX_SIZE_MB}MB.`);
      return;
    }
    try {
      await upload.run(turmaId, file);
    } catch {
      /* tratado pelo hook */
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastrar alunos em massa"
        description="Envie um PDF com nome + email dos alunos. A IA estrutura os dados e cria os usuários."
      />

      <Card>
        <CardHeader>
          <CardTitle>Upload de PDF</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tamanho máximo: {MAX_SIZE_MB}MB. Após o envio você pode acompanhar
            o relatório de criados e falhas.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="turma">Turma destino</Label>
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

            <div className="space-y-2">
              <Label htmlFor="file">PDF dos alunos</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  {file.name} · {(file.size / (1024 * 1024)).toFixed(2)}MB
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="md:col-span-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {upload.data && (
              <Alert variant="success" className="md:col-span-2">
                <AlertDescription>
                  Job criado com id #{upload.data.relatorio_id}. Status atual:{" "}
                  {upload.data.status}.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={upload.loading}>
                {upload.loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Enviar PDF
              </Button>
              <Button type="button" variant="secondary" disabled>
                <Download size={16} /> Exportar CSV (após processamento)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
