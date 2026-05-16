import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "~/lib/prisma.server";
import { createUserSession } from "~/lib/auth.server";

// Google's published issuers for ID tokens.
// https://developers.google.com/identity/sign-in/web/backend-auth
const GOOGLE_ISSUERS = new Set([
  "https://accounts.google.com",
  "accounts.google.com",
]);

let cachedClient: OAuth2Client | null = null;
function getClient(clientId: string) {
  if (!cachedClient) cachedClient = new OAuth2Client(clientId);
  return cachedClient;
}

export async function action({ request }: ActionFunctionArgs) {
  const clientId = process.env.PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { idToken } = await request.json();
  if (!idToken || typeof idToken !== "string") {
    return json({ error: "Missing Google token" }, { status: 400 });
  }

  let payload: import("google-auth-library").TokenPayload | undefined;
  try {
    const ticket = await getClient(clientId).verifyIdToken({
      idToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    return json({ error: "Invalid Google token" }, { status: 401 });
  }

  if (!payload || !payload.sub || !payload.email) {
    return json({ error: "Invalid Google token" }, { status: 401 });
  }
  if (!payload.iss || !GOOGLE_ISSUERS.has(payload.iss)) {
    return json({ error: "Invalid token issuer" }, { status: 401 });
  }
  if (payload.email_verified !== true) {
    return json({ error: "Google email not verified" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email: payload.email },
    update: {
      googleId: payload.sub,
      name: payload.name,
    },
    create: {
      email: payload.email,
      googleId: payload.sub,
      name: payload.name,
    },
  });

  return createUserSession({
    request,
    userId: user.id,
    redirectTo: "/",
  });
}
