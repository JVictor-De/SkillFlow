import type { Metadata } from "next";

import { TurmaDetalhe } from "@/features/turmas/turma-detalhe";

export const metadata: Metadata = {
  title: "Detalhe da turma",
};

export default function TurmaDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  return <TurmaDetalhe turmaId={id} />;
}
