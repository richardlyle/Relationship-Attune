export { quizzes } from "./framework-quizzes";
export type { Quiz, QuizOption, QuizQuestion, ResultProfile } from "./quiz-types";

import { quizzes } from "./framework-quizzes";
export function getQuiz(slug: string) { return quizzes.find((quiz) => quiz.slug === slug); }
