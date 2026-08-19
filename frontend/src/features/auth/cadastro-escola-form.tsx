"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cadastroEscola } from "@/lib/auth";
import { friendlyMessage } from "@/lib/errors";

export function CadastroEscolaForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    escola_nome: "",
    escola_cnpj: "",
    coordenador_nome: "",
    coordenador_email: "",
    coordenador_senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await cadastroEscola(form);
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyMessage(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-muted-foreground">
          Dados da escola
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="escola_nome">Nome da escola</Label>
            <Input
              id="escola_nome"
              required
              value={form.escola_nome}
              onChange={(e) => update("escola_nome", e.target.value)}
              placeholder="Colégio Horizonte"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="escola_cnpj">CNPJ</Label>
            <Input
              id="escola_cnpj"
              required
              value={form.escola_cnpj}
              onChange={(e) => update("escola_cnpj", e.target.value)}
              placeholder="00.000.000/0001-00"
            />
          </div>
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-muted-foreground">
          Conta do Coordenador / Diretor
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="coordenador_nome">Nome completo</Label>
            <Input
              id="coordenador_nome"
              required
              value={form.coordenador_nome}
              onChange={(e) => update("coordenador_nome", e.target.value)}
              placeholder="Maria da Silva"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="coordenador_email">E-mail</Label>
            <Input
              id="coordenador_email"
              type="email"
              required
              value={form.coordenador_email}
              onChange={(e) => update("coordenador_email", e.target.value)}
              placeholder="coordenador@escola.com"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="coordenador_senha">Senha</Label>
            <Input
              id="coordenador_senha"
              type="password"
              required
              minLength={8}
              value={form.coordenador_senha}
              onChange={(e) => update("coordenador_senha", e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        </div>
      </fieldset>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        Criar conta da escola
      </Button>
    </form>
  );
}
