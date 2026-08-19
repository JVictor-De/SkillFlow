"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trocarSenha } from "@/lib/auth";
import { friendlyMessage } from "@/lib/errors";

export function TrocarSenhaForm() {
  const router = useRouter();
  const [form, setForm] = useState({ atual: "", nova: "", confirmar: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (form.nova !== form.confirmar) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await trocarSenha({ senha_atual: form.atual, nova_senha: form.nova });
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyMessage(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="atual">Senha atual</Label>
        <Input
          id="atual"
          type="password"
          required
          value={form.atual}
          onChange={(e) => update("atual", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nova">Nova senha</Label>
        <Input
          id="nova"
          type="password"
          required
          minLength={8}
          value={form.nova}
          onChange={(e) => update("nova", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmar">Confirmar nova senha</Label>
        <Input
          id="confirmar"
          type="password"
          required
          minLength={8}
          value={form.confirmar}
          onChange={(e) => update("confirmar", e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 size={18} className="animate-spin" />}
        Atualizar senha
      </Button>
    </form>
  );
}
