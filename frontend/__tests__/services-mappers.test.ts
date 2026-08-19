/**
 * Bug 4 — "PDF abrindo 404".
 *
 * Os mappers `mapSubmissaoDetalhe` e `mapMaterial` são o último ponto
 * onde a URL de mídia é tocada antes de cair em um `<a href>`. Estes
 * testes garantem que:
 *
 *  - URLs relativas viram absolutas (caso histórico do bug).
 *  - URLs absolutas (depois do fix de `build_absolute_uri` no backend)
 *    são mantidas inalteradas.
 *  - `pdf_url` ausente vira `null` para a UI esconder o card.
 *  - Demais campos do schema continuam mapeados corretamente (não
 *    queremos regredir o resto do contrato ao mexer em uma única
 *    linha).
 */

import { mapMaterial, mapSubmissaoDetalhe } from "@/lib/services";

describe("mapSubmissaoDetalhe", () => {
  const baseRaw = {
    id: 9002,
    aluno_id: 100,
    aluno_nome: "Ana Beatriz",
    atividade_id: 500,
    atividade_titulo: "Revolução Industrial",
    tipo_atividade: "EXERCICIO",
    exercicio_id: 2,
    exercicio_ordem: 2,
    tipo_exercicio: "DISSERTATIVA",
    nota_calculada: 78,
    nota_final: 85,
    status: "REVISADA_PROFESSOR",
    turma_id: 10,
    turma_nome: "9º Ano A",
    enunciado: "Explique a relação entre Revolução Industrial e urbanização.",
    gabarito: "Esperar resposta abordando êxodo rural e urbanização.",
    resposta_texto: null,
    feedback_ia: null,
    feedback_professor: null,
    nota_professor_override: null,
  };

  it("absolutiza pdf_url relativo (cenário do Bug 4 antes do fix de backend)", () => {
    const out = mapSubmissaoDetalhe({
      ...baseRaw,
      pdf_url: "/media/submissoes/resp_123.pdf",
    });
    expect(out.pdf_url).toBe(
      "http://localhost:8000/media/submissoes/resp_123.pdf",
    );
  });

  it("preserva pdf_url já absoluto (depois do fix de build_absolute_uri)", () => {
    const absolute = "https://api.skillflow.peladeiro.cloud/media/submissoes/resp_X.pdf";
    const out = mapSubmissaoDetalhe({ ...baseRaw, pdf_url: absolute });
    expect(out.pdf_url).toBe(absolute);
  });

  it("retorna null para pdf_url ausente/nulo (UI esconde o card de PDF)", () => {
    expect(mapSubmissaoDetalhe({ ...baseRaw, pdf_url: null }).pdf_url).toBeNull();
    expect(
      mapSubmissaoDetalhe({ ...baseRaw, pdf_url: undefined }).pdf_url,
    ).toBeNull();
    expect(mapSubmissaoDetalhe({ ...baseRaw, pdf_url: "" }).pdf_url).toBeNull();
  });

  it("não regride os demais campos da submissão", () => {
    const out = mapSubmissaoDetalhe({
      ...baseRaw,
      pdf_url: "/media/submissoes/x.pdf",
    });
    expect(out.id).toBe(9002);
    expect(out.aluno_nome).toBe("Ana Beatriz");
    expect(out.atividade_titulo).toBe("Revolução Industrial");
    expect(out.atividade_tipo).toBe("EXERCICIO");
    expect(out.exercicio_tipo).toBe("DISSERTATIVA");
    expect(out.enunciado).toContain("Revolução Industrial");
    expect(out.gabarito).toContain("êxodo rural");
  });
});

describe("mapMaterial", () => {
  const baseRaw = {
    id: 1,
    titulo: "Apostila — Revolução Industrial",
    turma_id: 10,
    enviado_por_id: 1,
    criado_em: "2026-04-30T12:00:00Z",
  };

  it("absolutiza arquivo_url relativo", () => {
    const out = mapMaterial({
      ...baseRaw,
      arquivo_url: "/media/materiais/apostila.pdf",
    });
    expect(out.arquivo_url).toBe(
      "http://localhost:8000/media/materiais/apostila.pdf",
    );
  });

  it("preserva arquivo_url absoluto retornado pelo backend", () => {
    const absolute = "https://api.skillflow.peladeiro.cloud/media/materiais/x.pdf";
    expect(mapMaterial({ ...baseRaw, arquivo_url: absolute }).arquivo_url).toBe(
      absolute,
    );
  });

  it("converte arquivo_url ausente em string vazia (UI cai no fallback #)", () => {
    expect(mapMaterial({ ...baseRaw, arquivo_url: "" }).arquivo_url).toBe("");
    expect(mapMaterial({ ...baseRaw }).arquivo_url).toBe("");
  });
});
