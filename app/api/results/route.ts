import { getDb } from "../../../db";
import { quizResults } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureProfile } from "../../lib/dashboard-data";
import { getQuiz } from "../../lib/quizzes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });

  try {
    const payload = await request.json() as { quizSlug?: string; primaryType?: string };
    const quiz = payload.quizSlug ? getQuiz(payload.quizSlug) : undefined;
    const profile = quiz && payload.primaryType ? quiz.profiles[payload.primaryType] : undefined;
    if (!quiz || !profile || !payload.primaryType) {
      return Response.json({ error: "That quiz result is not valid." }, { status: 400 });
    }

    await ensureProfile(user);
    const db = getDb();
    const completedAt = new Date().toISOString();
    const values = {
      id: crypto.randomUUID(),
      ownerEmail: user.email,
      quizSlug: quiz.slug,
      primaryType: payload.primaryType,
      quizTitle: quiz.title,
      profileTitle: profile.title,
      summary: profile.summary,
      careJson: JSON.stringify(profile.care),
      completedAt,
    };
    await db.insert(quizResults).values(values).onConflictDoUpdate({
      target: [quizResults.ownerEmail, quizResults.quizSlug],
      set: {
        primaryType: values.primaryType,
        quizTitle: values.quizTitle,
        profileTitle: values.profileTitle,
        summary: values.summary,
        careJson: values.careJson,
        completedAt,
      },
    });
    return Response.json({ saved: true, completedAt });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not save that result." }, { status: 500 });
  }
}
