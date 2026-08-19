"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { esqueciSenha, resetSenha } from "@/lib/auth";
import { friendlyMessage } from "@/lib/errors";

export function EsqueciSenhaForm() {
  const [step, setStep] = useState<"email" | "token">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await esqueciSenha(email);
      setInfo("Se o email existir, enviaremos um token em alguns instantes.");
      setStep("token");
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetSenha(token, novaSenha);
      setInfo("Senha atualizada. Você já pode fazer login.");
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={onRequest} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {info && (
          <Alert variant="success">
            <AlertDescription>{info}</AlertDescription>
          </Alert>
        )}
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
          Enviar token
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onReset} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="token">Token recebido</Label>
        <Input
          id="token"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Cole o token enviado por e-mail"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nova">Nova senha</Label>
        <Input
          id="nova"
          type="password"
          required
          minLength={8}
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
      </div>

      {info && (
        <Alert variant="success">
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}
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
