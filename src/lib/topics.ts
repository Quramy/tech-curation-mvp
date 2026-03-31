export const TOPIC_CANDIDATES = [
  "Frontend",
  "React",
  "Next.js / RSC",
  "TypeScript",
  "Storybook",
  "Testing / VRT",
  "Browser APIs",
  "Web Standards",
  "JavaScript Features",
  "CSS Features",
  "Accessibility",
  "Performance",
  "AI Agent",
  "Node.js Tooling",
  "Build / CI / DX",
] as const;

export type Topic = (typeof TOPIC_CANDIDATES)[number];
