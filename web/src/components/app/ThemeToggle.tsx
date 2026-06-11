import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/hooks/useTheme";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Hell", icon: Sun },
  { value: "dark", label: "Dunkel", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Theme" title={`Theme: ${theme}`}>
          <Icon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1">
        {OPTIONS.map((opt) => {
          const I = opt.icon;
          const active = opt.value === theme;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm",
                "hover:bg-accent",
                active && "bg-accent text-accent-foreground",
              )}
            >
              <I className="size-4" />
              {opt.label}
              {active && <span className="ml-auto text-xs">✓</span>}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
