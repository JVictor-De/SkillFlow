import { cn } from "@/lib/utils";

type AvatarStackProps = {
  images: string[];
  size?: number;
  borderColor?: string;
  className?: string;
};

export function AvatarStack({
  images,
  size = 50,
  borderColor = "white",
  className,
}: AvatarStackProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {images.map((src, idx) => (
        <span
          key={`${src}-${idx}`}
          className={cn(
            "block rounded-full bg-cover bg-center",
            idx > 0 ? "-ml-3" : "",
          )}
          style={{
            width: size,
            height: size,
            backgroundImage: `url(${src})`,
            border: `3px solid ${borderColor}`,
            zIndex: images.length - idx,
          }}
          aria-hidden
        />
      ))}
    </div>
  );
}
