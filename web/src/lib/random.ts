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
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function randomLocal(): string {
  return `${pick(ADJ)}-${pick(NOUN)}-${Math.floor(Math.random() * 1000)}`;
}
