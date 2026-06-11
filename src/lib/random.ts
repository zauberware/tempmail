const ADJ = [
  "swift",
  "calm",
  "bold",
  "merry",
  "lucky",
  "brave",
  "quiet",
  "bright",
  "fuzzy",
  "noble",
  "happy",
  "witty",
  "smooth",
  "lively",
  "spicy",
  "snappy",
];
const NOUN = [
  "otter",
  "panda",
  "falcon",
  "willow",
  "comet",
  "ember",
  "harbor",
  "raven",
  "meadow",
  "thistle",
  "pebble",
  "lantern",
  "sparrow",
  "cobalt",
  "marble",
  "puffin",
];

function pick<T>(arr: T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx]!;
}

export function randomSlug(): string {
  const num = Math.floor(Math.random() * 1000);
  return `${pick(ADJ)}-${pick(NOUN)}-${num}`;
}

export function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
