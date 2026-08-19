"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureSaasRole, login } from "@/lib/auth";
import { friendlyMessage } from "@/lib/errors";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await login({ email, senha });
      ensureSaasRole(session.user);
      if (session.user.must_change_password) {
        router.replace("/trocar-senha");
        return;
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyMessage(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <div className="relative">
          <Input
            id="senha"
            name="senha"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            className="pr-10"
          />
          <button
            type="button"
            aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="w-full"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        Entrar na plataforma
      </Button>

      <p className="text-xs text-muted-foreground">
        Em ambiente de demonstração você pode usar
        <br />
        <span className="text-foreground">
          professor@skillflow.dev
        </span>{" "}
        ou{" "}
        <span className="text-foreground">
          coordenador@skillflow.dev
        </span>{" "}
        com qualquer senha de 4+ caracteres.
      </p>
    </form>
  );
}
