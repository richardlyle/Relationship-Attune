import { getChatGPTUser } from "../../chatgpt-auth";
import { getDashboard } from "../../lib/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  try {
    return Response.json(await getDashboard(user));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load your profile." }, { status: 500 });
  }
}
