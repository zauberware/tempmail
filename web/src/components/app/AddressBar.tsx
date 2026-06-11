import { useEffect, useState } from "react";
import {
  Copy,
  Mail,
  Shuffle,
  Check,
  RotateCw,
  Trash2,
  History,
  HelpCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { randomLocal } from "@/lib/random";
import type { InboxHistoryEntry } from "@/hooks/useInboxHistory";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  address: string;
  pool: string[];
  messageCount: number;
  isFetching: boolean;
  history: InboxHistoryEntry[];
  onApply: (local: string, domain: string) => void;
  onSwitch: (address: string) => void;
  onHistoryRemove: (address: string) => void;
  onRefresh: () => void;
  onClear: () => void;
}

function splitAddress(address: string): { local: string; domain: string } {
  const at = address.lastIndexOf("@");
  if (at < 0) return { local: address, domain: "" };
  return { local: address.slice(0, at), domain: address.slice(at + 1) };
}

function fmtAge(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "gerade";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export function AddressBar({
  address,
  pool,
  messageCount,
  isFetching,
  history,
  onApply,
  onSwitch,
  onHistoryRemove,
  onRefresh,
  onClear,
}: Props) {
  const initial = splitAddress(address);
  const [local, setLocal] = useState(initial.local);
  const [domain, setDomain] = useState(initial.domain || pool[0] || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const next = splitAddress(address);
    setLocal(next.local);
    setDomain(next.domain || pool[0] || "");
  }, [address, pool]);

  const apply = () => {
    const l = local.trim().toLowerCase();
    if (!l || !domain) return;
    onApply(l, domain);
  };

  const randomize = () => {
    const l = randomLocal();
    const d = pool[Math.floor(Math.random() * pool.length)] || domain;
    setLocal(l);
    setDomain(d);
    onApply(l, d);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const allDomains = domain && !pool.includes(domain) ? [...pool, domain] : pool;

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card/40 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <Mail className="size-5 text-primary" />
        <span>
          temp<span className="text-muted-foreground">mail</span>
        </span>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="local-part"
          className="max-w-[260px] font-mono"
          spellCheck={false}
          autoComplete="off"
        />
        <span className="text-muted-foreground">@</span>
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="min-w-[200px] font-mono">
            <SelectValue placeholder="domain" />
          </SelectTrigger>
          <SelectContent>
            {allDomains.map((d) => (
              <SelectItem key={d} value={d} className="font-mono">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={apply}>Übernehmen</Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={randomize} aria-label="Random">
              <Shuffle />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Random (n)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={copy} aria-label="Kopieren">
              {copied ? <Check className="text-green-500" /> : <Copy />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? "Kopiert ✓" : "Adresse kopieren (c)"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              aria-label="Refresh"
              disabled={isFetching}
            >
              <RotateCw className={isFetching ? "animate-spin" : ""} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh (r)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onClear}
              aria-label="Postfach leeren"
              disabled={messageCount === 0}
            >
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Postfach leeren (Shift+E)</TooltipContent>
        </Tooltip>

        <Popover>
          <PopoverTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Verlauf">
                  <History />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Letzte Inboxes</TooltipContent>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border p-3 text-xs font-semibold text-muted-foreground">
              Verlauf (lokal gespeichert)
            </div>
            {history.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Noch nichts hier.
              </div>
            ) : (
              <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {history.map((e) => {
                  const isCurrent = e.address === address;
                  return (
                    <li key={e.address} className="flex items-center gap-2 p-2 hover:bg-accent/50">
                      <button
                        className="flex-1 truncate text-left text-sm font-mono"
                        onClick={() => onSwitch(e.address)}
                        disabled={isCurrent}
                      >
                        {e.address}
                      </button>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {isCurrent ? "aktiv" : fmtAge(e.lastUsed)}
                      </span>
                      <button
                        onClick={() => onHistoryRemove(e.address)}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="aus Verlauf entfernen"
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          {messageCount} {messageCount === 1 ? "Mail" : "Mails"}
        </Badge>
        <Badge variant={isFetching ? "default" : "outline"}>{isFetching ? "lade…" : "live"}</Badge>
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Hilfe">
              <HelpCircle />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Tastenkürzel anzeigen (?)</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
