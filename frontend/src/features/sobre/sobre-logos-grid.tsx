import { Award, Compass, GraduationCap, ShieldCheck } from "lucide-react";

const recognitions: {
  icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
}[] = [
  {
    icon: GraduationCap,
    label: "EDUSELO",
  },
  {
    icon: Award,
    label: (
      <div className="text-center font-heading text-xs font-extrabold uppercase leading-tight tracking-[0.08em] text-wpa-darker">
        Selo
        <br />
        Educacional
        <br />
        Premium
      </div>
    ),
  },
  {
    icon: Compass,
    label: "BNCC ALIGN",
  },
  {
    icon: ShieldCheck,
    label: "LGPD READY",
  },
];

export function SobreLogosGrid() {
  return (
    <section className="bg-white pb-24 font-body md:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {recognitions.map((item, idx) => (
            <div
              key={idx}
              className="flex min-h-[120px] items-center justify-center bg-wpa-light p-10 text-wpa-gray transition-colors hover:bg-wpa-gray-soft/40"
            >
              <div className="flex items-center gap-2 text-base font-extrabold tracking-[0.06em] text-wpa-darker">
                <item.icon className="h-6 w-6 text-wpa-primary" />
                {typeof item.label === "string" ? (
                  <span className="font-heading">{item.label}</span>
                ) : (
                  item.label
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
