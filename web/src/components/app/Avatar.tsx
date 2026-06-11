import { cn } from "@/lib/utils";
import { avatarColor, initials } from "@/lib/avatar";

interface Props {
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function Avatar({ name, email, size = "sm", className }: Props) {
  const seed = (email || name || "?").toLowerCase();
  const color = avatarColor(seed);
  const ini = initials(name, email);
  const sizeCls = size === "md" ? "size-10 text-sm" : "size-9 text-xs";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        color,
        sizeCls,
        className,
      )}
      aria-hidden
    >
      {ini}
    </div>
  );
}
