import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "light";
type Size = "sm" | "md";

const baseClasses =
  "group inline-flex w-max items-center justify-between gap-3 rounded-lg pl-5 pr-1.5 py-1.5 text-[0.78rem] font-bold uppercase tracking-[0.08em] leading-none transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wpa-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-wpa-primary text-wpa-darker hover:bg-wpa-primary/90 hover:shadow-[0_14px_36px_-12px_rgba(34,180,205,0.55)]",
  dark: "bg-wpa-darker text-white hover:bg-black",
  light:
    "bg-white text-wpa-darker hover:bg-wpa-light shadow-[0_4px_18px_-6px_rgba(0,0,0,0.18)]",
};

const arrowVariantClasses: Record<Variant, string> = {
  primary: "bg-wpa-darker text-white",
  dark: "bg-white text-wpa-darker",
  light: "bg-wpa-darker text-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-[42px]",
  md: "min-h-[48px]",
};

const arrowSizeClasses: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

type SharedProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  iconClassName?: string;
  children: React.ReactNode;
};

type AsLinkProps = SharedProps & {
  href: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedProps>;

type AsButtonProps = SharedProps & {
  href?: undefined;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps>;

export type UnifiedButtonProps = AsLinkProps | AsButtonProps;

function Inner({
  variant = "primary",
  size = "md",
  iconClassName,
  children,
}: {
  variant?: Variant;
  size?: Size;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="font-heading">{children}</span>
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md transition-transform duration-300 group-hover:translate-x-0.5",
          arrowVariantClasses[variant],
          arrowSizeClasses[size],
          iconClassName,
        )}
      >
        <ArrowUpRight strokeWidth={2.4} className="h-4 w-4" />
      </span>
    </>
  );
}

export function UnifiedButton(props: UnifiedButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    iconClassName,
    children,
    ...rest
  } = props;

  const finalClassName = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (typeof rest.href === "string") {
    const { href, ...anchorProps } = rest as AsLinkProps;
    return (
      <Link href={href} className={finalClassName} {...anchorProps}>
        <Inner variant={variant} size={size} iconClassName={iconClassName}>
          {children}
        </Inner>
      </Link>
    );
  }

  const buttonProps = rest as AsButtonProps;
  return (
    <button className={finalClassName} {...buttonProps}>
      <Inner variant={variant} size={size} iconClassName={iconClassName}>
        {children}
      </Inner>
    </button>
  );
}
