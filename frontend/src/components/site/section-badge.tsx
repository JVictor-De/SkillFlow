import { cn } from "@/lib/utils";

type SectionBadgeProps = {
  children: React.ReactNode;
  tone?: "light" | "dark" | "primary";
  align?: "start" | "center";
  className?: string;
};

export function SectionBadge({
  children,
  tone = "light",
  align = "start",
  className,
}: SectionBadgeProps) {
  const colorMap: Record<NonNullable<SectionBadgeProps["tone"]>, string> = {
    light: "text-wpa-darker",
    dark: "text-[#0E2A47]",
    primary: "text-wpa-primary",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.16em]",
        align === "center" ? "justify-center" : "",
        colorMap[tone],
        className,
      )}
    >
      <span className="block h-[3px] w-5 bg-wpa-primary" aria-hidden />
      {children}
    </span>
  );
}
