export type QuizOption = { label: string; value: string };
export type QuizQuestion = { prompt: string; options: QuizOption[] };
export type ResultProfile = { title: string; summary: string; care: string[]; watchFor: string };
export type Quiz = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  time: string;
  icon: string;
  accent: string;
  scoring?: "dominant" | "four-letter";
  dimensions?: Array<[string, string]>;
  questions: QuizQuestion[];
  profiles: Record<string, ResultProfile>;
};
