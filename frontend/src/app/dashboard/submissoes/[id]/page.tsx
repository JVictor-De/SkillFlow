import { SubmissaoDetalheView } from "@/features/submissoes/submissao-detalhe";

export default function SubmissaoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  return <SubmissaoDetalheView submissaoId={Number(params.id)} />;
}
