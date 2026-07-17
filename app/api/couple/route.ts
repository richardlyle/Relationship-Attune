import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { couples, profiles } from "../../../db/schema";
import { getCurrentUser } from "../../auth";
import { ensureProfile, getDashboard, makeInviteCode } from "../../lib/dashboard-data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });

  try {
    const payload = await request.json() as { action?: string; code?: string };
    const db = getDb();
    const profile = await ensureProfile(user);

    if (payload.action === "create") {
      if (profile.coupleId) return Response.json({ couple: (await getDashboard(user)).couple });

      let created = false;
      for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
        const inviteCode = makeInviteCode();
        const coupleId = crypto.randomUUID();
        try {
          await db.insert(couples).values({ id: coupleId, inviteCode, createdByEmail: user.id });
          await db.update(profiles).set({ coupleId, updatedAt: new Date().toISOString() }).where(eq(profiles.email, user.id));
          created = true;
        } catch (error) {
          if (attempt === 2) throw error;
        }
      }
      return Response.json({ couple: (await getDashboard(user)).couple }, { status: 201 });
    }

    if (payload.action === "join") {
      const code = payload.code?.trim().toUpperCase() ?? "";
      if (!/^[A-Z2-9]{6}$/.test(code)) {
        return Response.json({ error: "That code should contain six letters or numbers." }, { status: 400 });
      }
      const [couple] = await db.select().from(couples).where(eq(couples.inviteCode, code)).limit(1);
      if (!couple) return Response.json({ error: "We could not find that code. Check it and try again." }, { status: 404 });
      if (profile.coupleId && profile.coupleId !== couple.id) {
        return Response.json({ error: "Your profile is already connected to another shared space." }, { status: 409 });
      }
      const members = await db.select({ email: profiles.email }).from(profiles).where(eq(profiles.coupleId, couple.id)).limit(3);
      if (!members.some((member) => member.email === user.id) && members.length >= 2) {
        return Response.json({ error: "That shared space already has two people." }, { status: 409 });
      }
      await db.update(profiles).set({ coupleId: couple.id, updatedAt: new Date().toISOString() }).where(eq(profiles.email, user.id));
      return Response.json({ couple: (await getDashboard(user)).couple });
    }

    return Response.json({ error: "Choose whether to create or join a space." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not connect your profiles." }, { status: 500 });
  }
}
