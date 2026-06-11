// Lightweight dropdown menu (Popover under the hood) — simpler than @radix-ui/react-dropdown-menu
// and good enough for our overflow menu.
import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { cn } from "@/lib/utils";

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
}

export function DropdownItem({
  className,
  icon,
  destructive,
  children,
  ...props
}: DropdownItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm",
        "hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
        destructive && "text-destructive hover:bg-destructive/10",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="inline-flex size-4 shrink-0 items-center justify-center">{icon}</span>
      ) : null}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />;
}

export {
  Popover as DropdownRoot,
  PopoverTrigger as DropdownTrigger,
  PopoverContent as DropdownContent,
};
