import type { Metadata } from "next";
import { getCurrentUser } from "./auth";
import RelationshipApp from "./components/RelationshipApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Relatune — Personality-aware care for couples",
  description: "A private space for thoughtful quizzes, shared care maps, and personalized weekly PAIR Notes.",
};

export default async function Home() {
  const user = await getCurrentUser();
  return <RelationshipApp user={user} />;
}
