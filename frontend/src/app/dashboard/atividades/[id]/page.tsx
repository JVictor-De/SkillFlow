import { AtividadeDetalhe } from "@/features/atividades/atividade-detalhe";

export default function AtividadeDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  return <AtividadeDetalhe atividadeId={Number(params.id)} />;
}
