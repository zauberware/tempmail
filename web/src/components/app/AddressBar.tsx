import { useEffect, useState } from "react";
import {
  Copy,
  Hourglass,
  Shuffle,
  Check,
  RotateCw,
  Trash2,
  History,
  HelpCircle,
  Info,
  MoreVertical,
  X,
  Sun,
  Moon,
  Monitor,
  Languages,
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
import { DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { randomLocal } from "@/lib/random";
import type { InboxHistoryEntry } from "@/hooks/useInboxHistory";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/lib/i18n-context";
import { tAge, tMails } from "@/lib/i18n";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageMenu } from "./LanguageMenu";

interface Props {
  address: string;
  pool: string[];
  messageCount: number;
  isFetching: boolean;
  history: InboxHistoryEntry[];
  isMobile: boolean;
  onApply: (local: string, domain: string) => void;
  onSwitch: (address: string) => void;
  onHistoryRemove: (address: string) => void;
  onRefresh: () => void;
  onClear: () => void;
  onShowOnboarding: () => void;
  onShowShortcuts: () => void;
}

function splitAddress(address: string): { local: string; domain: string } {
  const at = address.lastIndexOf("@");
  if (at < 0) return { local: address, domain: "" };
  return { local: address.slice(0, at), domain: address.slice(at + 1) };
}

export function AddressBar({
  address,
  pool,
  messageCount,
  isFetching,
  history,
  isMobile,
  onApply,
  onSwitch,
  onHistoryRemove,
  onRefresh,
  onClear,
  onShowOnboarding,
  onShowShortcuts,
}: Props) {
  const { t, lang, pref, setPref } = useI18n();
  const initial = splitAddress(address);
  const [local, setLocal] = useState(initial.local);
  const [domain, setDomain] = useState(initial.domain || pool[0] || "");
  const [copied, setCopied] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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

  const HistoryPopover = (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("history_label")}
          title={t("history_label")}
        >
          <History />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b border-border p-3 text-xs font-semibold text-muted-foreground">
          {t("history_header")}
        </div>
        {history.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">{t("history_empty")}</div>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {history.map((e) => {
              const isCurrent = e.address === address;
              return (
                <li key={e.address} className="flex items-center gap-2 p-2 hover:bg-accent/50">
                  <button
                    className="flex-1 truncate text-left font-mono text-sm"
                    onClick={() => onSwitch(e.address)}
                    disabled={isCurrent}
                  >
                    {e.address}
                  </button>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {isCurrent ? t("active") : tAge(Date.now() - e.lastUsed, lang)}
                  </span>
                  <button
                    onClick={() => onHistoryRemove(e.address)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t("history_remove")}
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
  );

  if (isMobile) {
    return (
      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <Hourglass className="size-5 text-primary" />
            <span>Tempus</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {messageCount}
            </Badge>
            <Badge variant={isFetching ? "default" : "outline"} className="text-xs">
              {isFetching ? t("loading_short") : t("live_state")}
            </Badge>
            <Popover open={moreOpen} onOpenChange={setMoreOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("menu_label")}>
                  <MoreVertical />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1">
                <DropdownItem
                  icon={<Copy className="size-4" />}
                  onClick={() => {
                    setMoreOpen(false);
                    copy();
                  }}
                >
                  {copied ? t("copy_address_done") : t("copy_address")}
                </DropdownItem>
                <DropdownItem
                  icon={<Shuffle className="size-4" />}
                  onClick={() => {
                    setMoreOpen(false);
                    randomize();
                  }}
                >
                  {t("new_random")}
                </DropdownItem>
                <DropdownItem
                  icon={<RotateCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />}
                  onClick={() => {
                    setMoreOpen(false);
                    onRefresh();
                  }}
                  disabled={isFetching}
                >
                  {t("refresh_label")}
                </DropdownItem>
                <DropdownItem
                  icon={<Trash2 className="size-4" />}
                  onClick={() => {
                    setMoreOpen(false);
                    onClear();
                  }}
                  disabled={messageCount === 0}
                  destructive
                >
                  {t("clear_label")}
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem icon={<Sun className="size-4" />} onClick={() => setTheme("light")}>
                  {t("theme_light")} {theme === "light" && "✓"}
                </DropdownItem>
                <DropdownItem icon={<Moon className="size-4" />} onClick={() => setTheme("dark")}>
                  {t("theme_dark")} {theme === "dark" && "✓"}
                </DropdownItem>
                <DropdownItem
                  icon={<Monitor className="size-4" />}
                  onClick={() => setTheme("system")}
                >
                  {t("theme_system")} {theme === "system" && "✓"}
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  icon={<Languages className="size-4" />}
                  onClick={() => setPref("auto")}
                >
                  {t("lang_auto")} {pref === "auto" && "✓"}
                </DropdownItem>
                <DropdownItem
                  icon={<span className="font-mono text-xs">de</span>}
                  onClick={() => setPref("de")}
                >
                  {t("lang_de")} {pref === "de" && "✓"}
                </DropdownItem>
                <DropdownItem
                  icon={<span className="font-mono text-xs">en</span>}
                  onClick={() => setPref("en")}
                >
                  {t("lang_en")} {pref === "en" && "✓"}
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  icon={<HelpCircle className="size-4" />}
                  onClick={() => {
                    setMoreOpen(false);
                    onShowShortcuts();
                  }}
                >
                  {t("shortcuts_label")}
                </DropdownItem>
                <DropdownItem
                  icon={<Info className="size-4" />}
                  onClick={() => {
                    setMoreOpen(false);
                    onShowOnboarding();
                  }}
                >
                  {t("tour_label")}
                </DropdownItem>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-3 pt-2 pb-3">
          <Input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="local-part"
            className="min-w-0 flex-1 font-mono"
            spellCheck={false}
            autoComplete="off"
          />
          <span className="text-muted-foreground">@</span>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger className="min-w-0 flex-1 font-mono">
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
          <Button onClick={apply} className="shrink-0">
            {t("apply")}
          </Button>
          {HistoryPopover}
        </div>
      </header>
    );
  }

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card/40 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <Hourglass className="size-5 text-primary" />
        <span>Tempus</span>
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
        <Button onClick={apply}>{t("apply")}</Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={randomize} aria-label={t("new_random")}>
              <Shuffle />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("random_tooltip")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={copy} aria-label={t("copy_address")}>
              {copied ? <Check className="text-green-500" /> : <Copy />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? t("copied_state") : t("copy_tooltip")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              aria-label={t("refresh_label")}
              disabled={isFetching}
            >
              <RotateCw className={isFetching ? "animate-spin" : ""} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("refresh_tooltip")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onClear}
              aria-label={t("clear_label")}
              disabled={messageCount === 0}
            >
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("clear_tooltip")}</TooltipContent>
        </Tooltip>
        {HistoryPopover}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          {tMails(messageCount, lang)}
        </Badge>
        <Badge variant={isFetching ? "default" : "outline"}>
          {isFetching ? t("loading_state") : t("live_state")}
        </Badge>
        <LanguageMenu />
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("shortcuts_label")}
              onClick={onShowShortcuts}
            >
              <HelpCircle />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("shortcuts_tooltip")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("tour_label")}
              onClick={onShowOnboarding}
            >
              <Info />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("tour_tooltip")}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
