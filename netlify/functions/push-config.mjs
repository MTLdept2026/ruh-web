import { jsonResponse } from "../lib/push-store.mjs";

export default async function pushConfig() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return jsonResponse(
      {
        configured: false,
        error: "Missing VAPID_PUBLIC_KEY on this Netlify site.",
      },
      { status: 503 }
    );
  }

  return jsonResponse({
    configured: true,
    vapidPublicKey,
  });
}
