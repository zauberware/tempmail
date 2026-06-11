import { useEffect, useState } from "react";
import { Copy, Mail, Shuffle, Check } from "lucide-react";
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
import { randomLocal } from "@/lib/random";

interface Props {
  address: string;
  pool: string[];
  messageCount: number;
  isFetching: boolean;
  onApply: (local: string, domain: string) => void;
}

function splitAddress(address: string): { local: string; domain: string } {
  const at = address.lastIndexOf("@");
  if (at < 0) return { local: address, domain: "" };
  return { local: address.slice(0, at), domain: address.slice(at + 1) };
}

export function AddressBar({ address, pool, messageCount, isFetching, onApply }: Props) {
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
        <Button variant="outline" onClick={randomize}>
          <Shuffle /> Random
        </Button>
        <Button variant="outline" onClick={copy}>
          {copied ? <Check className="text-green-500" /> : <Copy />}
          {copied ? "Kopiert" : "Kopieren"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          {messageCount} {messageCount === 1 ? "Mail" : "Mails"}
        </Badge>
        <Badge variant={isFetching ? "default" : "outline"}>{isFetching ? "lade…" : "live"}</Badge>
      </div>
    </header>
  );
}
