import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({
  initials,
  color = "bg-zinc-500",
  size = "sm",
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0",
        sizeMap[size],
        color,
        className,
      )}
    >
      {initials}
    </div>
  );
}
