import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        aria-hidden
        className="relative h-9 w-9 rounded-xl bg-gradient-brand shadow-glow"
      >
        <div className="absolute inset-[3px] rounded-[10px] bg-[#0c0c14]/85" />
        <div className="absolute inset-0 grid place-items-center text-white">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 14C8 14 8 6 12 6C16 6 16 18 20 18"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="20" cy="18" r="2" fill="white" />
          </svg>
        </div>
      </div>
      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-semibold tracking-tight">
            SkillFlow
          </span>
        </div>
      )}
    </div>
  );
}
