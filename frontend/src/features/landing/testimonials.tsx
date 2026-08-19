import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Reduzimos o tempo de correção em 80%. O SkillFlow me devolveu o que mais falta a todo coordenador: tempo para cuidar dos alunos que mais precisam.",
    name: "Profª Marina Souza",
    role: "Coordenadora pedagógica · Colégio Horizonte",
  },
  {
    quote:
      "O painel de dados transformou nossas reuniões pedagógicas. Chegamos com evidências, não com intuições — e as decisões ficaram muito mais precisas e ágeis.",
    name: "Prof. Henrique Lopes",
    role: "Diretor · Instituto Aurora",
  },
  {
    quote:
      "Os pais deixaram de esperar o boletim trimestral. Agora acompanham tudo em tempo real — e a confiança na escola cresceu visivelmente entre as famílias.",
    name: "Beatriz Almeida",
    role: "Coordenadora · Escola Vivência",
  },
];

export function Testimonials() {
  return (
    <section id="provas" className="relative overflow-hidden bg-slate-50 border-t border-slate-200">
      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#24B4CD]">
            O que dizem os gestores
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Gestores que transformaram sua operação pedagógica
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-md px-6 py-8 md:p-8 transition-all duration-300 hover:border-[#24B4CD]/30 hover:-translate-y-1"
            >
              <Quote className="text-[#24B4CD]/70" size={26} />
              <blockquote className="mt-5 text-base leading-relaxed text-slate-700">
                {t.quote}
              </blockquote>
              <figcaption className="mt-8 border-t border-slate-100 pt-5 text-sm">
                <div className="font-semibold text-slate-900">{t.name}</div>
                <div className="mt-1 text-[#24B4CD]">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
