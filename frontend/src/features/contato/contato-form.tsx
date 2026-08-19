"use client";

import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";

import { SectionBadge } from "@/components/site/section-badge";
import { cn } from "@/lib/utils";

type ContatoState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

const initialState: ContatoState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

export function ContatoForm() {
  const [values, setValues] = useState<ContatoState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  const update =
    (key: keyof ContatoState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    // Mantemos o comportamento original de "submeter" sem backend conectado.
    setTimeout(() => {
      setStatus("success");
    }, 600);
  };

  return (
    <div>
      <SectionBadge tone="light">Contate-nos</SectionBadge>
      <h2 className="mt-3 max-w-md font-heading text-[clamp(2rem,4.4vw,3.4rem)] font-light leading-[1.1] text-wpa-darker">
        Vamos trabalhar
        <br />
        <span className="text-wpa-gray">
          juntos
          <br /> de forma inteligente!
        </span>
      </h2>

      <form
        onSubmit={handleSubmit}
        className="mt-10 flex flex-col gap-7"
        aria-label="Formulário de contato"
        noValidate
      >
        <div className="grid gap-7 md:grid-cols-2 md:gap-5">
          <Field
            id="contato-nome"
            label="Primeiro nome*"
            type="text"
            value={values.firstName}
            onChange={update("firstName")}
            autoComplete="given-name"
            required
          />
          <Field
            id="contato-sobrenome"
            label="Sobrenome*"
            type="text"
            value={values.lastName}
            onChange={update("lastName")}
            autoComplete="family-name"
            required
          />
        </div>

        <Field
          id="contato-email"
          label="Seu endereço de e-mail*"
          type="email"
          value={values.email}
          onChange={update("email")}
          autoComplete="email"
          required
        />

        <Field
          id="contato-telefone"
          label="Número de telefone"
          type="tel"
          value={values.phone}
          onChange={update("phone")}
          autoComplete="tel"
        />

        <TextareaField
          id="contato-mensagem"
          label="Como podemos ajudar a sua escola?"
          value={values.message}
          onChange={update("message")}
        />

        <div className="pt-4">
          <button
            type="submit"
            disabled={status === "submitting"}
            className={cn(
              "group inline-flex items-center justify-between gap-4 rounded-lg bg-wpa-primary py-1.5 pl-7 pr-2 text-[0.8rem] font-bold uppercase tracking-[0.08em] text-wpa-darker transition-all duration-300",
              "hover:shadow-[0_18px_40px_-12px_rgba(34,180,205,0.55)] disabled:opacity-60",
            )}
          >
            <span className="font-heading">
              {status === "submitting"
                ? "Enviando…"
                : status === "success"
                  ? "Mensagem enviada"
                  : "Enviar agora"}
            </span>
            <span
              aria-hidden
              className="inline-flex h-9 w-12 items-center justify-center rounded-md bg-white text-wpa-darker transition-transform duration-300 group-hover:translate-x-0.5"
            >
              <ArrowRight size={18} strokeWidth={2.4} />
            </span>
          </button>

          {status === "success" ? (
            <p className="mt-4 text-sm text-wpa-primary" role="status">
              Recebemos a sua mensagem. Em breve, nosso time entrará em
              contato.
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type: React.HTMLInputTypeAttribute;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  required?: boolean;
};

function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-wpa-gray-soft pb-1 transition-colors focus-within:border-wpa-primary">
      <label htmlFor={id} className="text-xs text-wpa-gray">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        className="w-full bg-transparent text-base text-wpa-darker outline-none placeholder:text-wpa-gray-soft"
      />
    </div>
  );
}

type TextareaFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function TextareaField({ id, label, value, onChange }: TextareaFieldProps) {
  return (
    <div className="relative flex flex-col gap-1 border-b border-wpa-gray-soft pb-1 transition-colors focus-within:border-wpa-primary">
      <label htmlFor={id} className="text-xs text-wpa-gray">
        {label}
      </label>
      <textarea
        id={id}
        rows={1}
        value={value}
        onChange={onChange}
        className="w-full resize-none bg-transparent text-base text-wpa-darker outline-none placeholder:text-wpa-gray-soft"
      />
      <span
        aria-hidden
        className="absolute bottom-1 right-0 text-xs text-wpa-gray-soft"
      >
        {"//"}
      </span>
    </div>
  );
}
