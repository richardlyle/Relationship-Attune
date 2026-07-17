import type { Metadata } from "next";
import { getChatGPTUser } from "./chatgpt-auth";
import RelationshipApp from "./components/RelationshipApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Between Us — Personality quizzes for couples",
  description: "A private two-person space for thoughtful quizzes, shared results, and practical ways to care for each other.",
};

export default async function Home() {
  const user = await getChatGPTUser();
  return <RelationshipApp user={user} />;
}
