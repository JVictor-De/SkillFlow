import { Network } from "lucide-react";

export function ContatoSideArt() {
  return (
    <div className="contato-right-col relative hidden justify-end md:flex">
      <div
        aria-hidden
        className="absolute bottom-5 left-0 z-[1] flex h-44 w-44 items-center justify-center rounded-lg bg-wpa-light"
      >
        <span className="absolute h-32 w-32 rounded-full border border-wpa-gray-soft" />
        <span className="absolute h-20 w-20 rounded-full border border-wpa-gray-soft" />

        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-wpa-primary text-2xl font-bold text-white">
          *
        </span>

        <span className="absolute right-7 top-7 flex h-5 w-5 items-center justify-center rounded-full bg-wpa-darker text-[10px] font-semibold text-white">
          %
        </span>
        <span className="absolute bottom-7 right-7 flex h-5 w-5 items-center justify-center rounded-full bg-wpa-darker text-[10px] font-semibold text-white">
          O
        </span>
        <span className="absolute bottom-12 left-7 flex h-5 w-5 items-center justify-center rounded-full bg-wpa-darker text-[10px] font-semibold text-white">
          !
        </span>
      </div>

      <div className="relative z-[2] h-[500px] w-[380px] max-w-full overflow-hidden rounded-lg bg-[#333] p-9 text-white shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
        <div className="mb-8 inline-flex items-center justify-center rounded bg-wpa-primary p-1.5 text-wpa-darker">
          <Network size={20} strokeWidth={2} />
        </div>

        <h3 className="font-heading text-[1.7rem] font-light leading-[1.3]">
          Uma linha direta para uma estratégia escolar mais inteligente.
        </h3>

        <svg
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[260px] w-full opacity-30"
        >
          <path
            d="M0 150 Q 200 200 380 50"
            fill="none"
            stroke="#fff"
            strokeWidth="1"
          />
          <path
            d="M0 250 Q 150 100 380 200"
            fill="none"
            stroke="#fff"
            strokeWidth="1"
          />
        </svg>

        <span className="absolute bottom-32 right-7 rounded-full bg-white/20 px-4 py-1 text-xs backdrop-blur">
          Equipe pedagógica
        </span>
        <span className="absolute bottom-44 left-7 rounded-full bg-white/20 px-4 py-1 text-xs backdrop-blur">
          Rede escolar
        </span>
        <span className="absolute bottom-56 right-20 rounded-full bg-white/20 px-4 py-1 text-xs backdrop-blur">
          IA dedicada
        </span>
      </div>
    </div>
  );
}
