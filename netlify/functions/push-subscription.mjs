import {
  deleteSubscriptionRecord,
  getSubscriptionRecord,
  jsonResponse,
  mergeReminderState,
  normalizeReminder,
  pruneReminders,
  resolveOrigin,
  saveSubscriptionRecord,
  subscriptionIdFromEndpoint,
} from "../lib/push-store.mjs";

function invalidSubscriptionResponse() {
  return jsonResponse(
    { ok: false, error: "A valid push subscription with endpoint and keys is required." },
    { status: 400 }
  );
}

export default async function pushSubscription(req) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, { status: 405 });
  }

  const payload = await req.json().catch(() => null);
  const subscription = payload?.subscription;

  if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
    return invalidSubscriptionResponse();
  }

  if (req.method === "DELETE") {
    await deleteSubscriptionRecord(subscription.endpoint);
    return jsonResponse({ ok: true, deleted: true });
  }

  const origin = resolveOrigin(req, payload?.origin);
  const existing = await getSubscriptionRecord(subscription.endpoint);
  const incomingReminders = Array.isArray(payload?.reminders)
    ? payload.reminders
        .map((reminder) => normalizeReminder(reminder, origin))
        .filter(Boolean)
    : [];
  const reminders = pruneReminders(
    mergeReminderState(existing?.reminders || [], incomingReminders)
  );
  const timestamp = new Date().toISOString();

  const record = {
    id: subscriptionIdFromEndpoint(subscription.endpoint),
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
    lastSyncedAt: timestamp,
    lastDispatchAt: existing?.lastDispatchAt || null,
    enabled: payload?.enabled !== false,
    permission: typeof payload?.permission === "string" ? payload.permission : "unknown",
    timezone: typeof payload?.timezone === "string" ? payload.timezone : null,
    locationLabel: typeof payload?.locationLabel === "string" ? payload.locationLabel : null,
    standalone: !!payload?.standalone,
    platform: {
      userAgent: typeof payload?.platform?.userAgent === "string" ? payload.platform.userAgent : null,
      language: typeof payload?.platform?.language === "string" ? payload.platform.language : null,
    },
    origin,
    reminders,
  };

  await saveSubscriptionRecord(record);

  return jsonResponse({
    ok: true,
    id: record.id,
    enabled: record.enabled,
    reminders: record.reminders.length,
  });
}
