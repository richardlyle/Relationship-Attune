import { deleteSession } from "../../../auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: new URL("/", request.url).toString(),
    },
  });
  try {
    response.headers.append("Set-Cookie", await deleteSession(request));
  } catch {
    response.headers.append("Set-Cookie", "between_us_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  }
  return response;
}
