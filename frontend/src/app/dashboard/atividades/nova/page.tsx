import type { Metadata } from "next";

import { NovaAtividade } from "@/features/atividades/nova-atividade";

export const metadata: Metadata = {
  title: "Nova atividade",
};

export default function NovaAtividadePage({
  searchParams,
}: {
  searchParams: { turma_id?: string };
}) {
  const turmaInicial = searchParams.turma_id
    ? Number(searchParams.turma_id)
    : undefined;
  return <NovaAtividade turmaInicial={turmaInicial} />;
}
