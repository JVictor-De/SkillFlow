const schools = [
  "COLÉGIO HORIZONTE",
  "INSTITUTO AURORA",
  "ESCOLA VIVÊNCIA",
  "ED. TÉCNICO BRASIL",
  "COLÉGIO VITÓRIA",
];

// Each list is duplicated so the track is exactly 2× one loop.
// The animation moves translateX(-50%), landing on a visually identical
// frame — the loop restart is imperceptible.
const track = [...schools, ...schools];

export function Cases() {
  return (
    <section
      id="cases"
      aria-label="Mais de 120 instituições já escolheram o SkillFlow"
      className="border-b border-[#0E2A47]/10 bg-[#F8FAFC] py-10 font-body"
    >
      <div
        className={[
          "group relative overflow-hidden",
          "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        ].join(" ")}
      >
        <div className="flex w-max animate-marquee-x items-center group-hover:[animation-play-state:paused]">
          {track.map((name, i) => (
            <div key={i} className="flex items-center">
              <span className="whitespace-nowrap px-10 font-heading text-sm font-extrabold tracking-[0.12em] text-[#0E2A47]/55">
                {name}
              </span>
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#24B4CD]/45"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
