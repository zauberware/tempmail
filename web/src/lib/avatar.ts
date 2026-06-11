const PALETTE = [
  "bg-rose-500",
  "bg-pink-500",
  "bg-fuchsia-500",
  "bg-purple-500",
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-green-500",
  "bg-lime-600",
  "bg-amber-500",
  "bg-orange-500",
  "bg-red-500",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function avatarColor(seed: string): string {
  return PALETTE[hash(seed) % PALETTE.length]!;
}

export function initials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const base = (name || email || "?").trim();
  if (!base) return "?";
  // Try first letters of two words
  const words = base
    .replace(/[<>()]/g, "")
    .split(/[\s.@_-]+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}
