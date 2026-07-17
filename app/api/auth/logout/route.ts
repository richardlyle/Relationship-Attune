import { deleteSession } from "../../../auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = Response.redirect(new URL("/", request.url), 303);
  try {
    response.headers.append("Set-Cookie", await deleteSession(request));
  } catch {
    response.headers.append("Set-Cookie", "between_us_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}
