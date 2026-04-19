import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";

const PUSH_STORE_NAME = "ruh-push-subscriptions";
const SUBSCRIPTION_PREFIX = "subscriptions/";

export function getPushStore() {
  return getStore(PUSH_STORE_NAME);
}

export function jsonResponse(payload, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
}

export function subscriptionIdFromEndpoint(endpoint) {
  return createHash("sha256").update(String(endpoint || "")).digest("hex").slice(0, 24);
}

export function subscriptionKeyFromEndpoint(endpoint) {
  return `${SUBSCRIPTION_PREFIX}${subscriptionIdFromEndpoint(endpoint)}`;
}

export function resolveOrigin(req, explicitOrigin) {
  if (typeof explicitOrigin === "string" && /^https?:\/\//.test(explicitOrigin)) {
    return explicitOrigin.replace(/\/$/, "");
  }

  try {
    return new URL(req.url).origin;
  } catch (_) {
    return (process.env.URL || "").replace(/\/$/, "");
  }
}

export function normalizeReminder(reminder, origin) {
  if (!reminder || !Number.isFinite(reminder.timeMs)) return null;

  const id = typeof reminder.id === "string" && reminder.id ? reminder.id : `ruh-${reminder.timeMs}`;
  const screen = typeof reminder.screen === "string" && reminder.screen ? reminder.screen : "home";
  const path = typeof reminder.url === "string" && reminder.url
    ? reminder.url
    : `/?screen=${encodeURIComponent(screen)}&reminder=${encodeURIComponent(id)}`;
  const url = /^https?:\/\//.test(path)
    ? path
    : `${origin}${path.startsWith("/") ? "" : "/"}${path}`;

  return {
    id,
    title: typeof reminder.title === "string" && reminder.title ? reminder.title : "Ruh",
    body: typeof reminder.body === "string" ? reminder.body : "",
    timeMs: reminder.timeMs,
    screen,
    tag: typeof reminder.tag === "string" && reminder.tag ? reminder.tag : id,
    url,
    sentAt: typeof reminder.sentAt === "string" ? reminder.sentAt : null,
  };
}

export function mergeReminderState(existingReminders = [], incomingReminders = []) {
  const sentById = new Map(
    existingReminders
      .filter((reminder) => reminder && typeof reminder.id === "string")
      .map((reminder) => [reminder.id, reminder.sentAt || null])
  );

  return incomingReminders.map((reminder) => ({
    ...reminder,
    sentAt: sentById.get(reminder.id) || reminder.sentAt || null,
  }));
}

export function pruneReminders(reminders = [], now = Date.now()) {
  return reminders.filter((reminder) => reminder && reminder.timeMs > now - (6 * 60 * 60 * 1000));
}

export async function getSubscriptionRecord(endpoint) {
  const store = getPushStore();
  return store.get(subscriptionKeyFromEndpoint(endpoint), { type: "json" });
}

export async function saveSubscriptionRecord(record) {
  const store = getPushStore();
  await store.setJSON(subscriptionKeyFromEndpoint(record.endpoint), record);
  return record;
}

export async function deleteSubscriptionRecord(endpoint) {
  const store = getPushStore();
  await store.delete(subscriptionKeyFromEndpoint(endpoint));
}

export async function listSubscriptionRecords() {
  const store = getPushStore();
  const { blobs } = await store.list({ prefix: SUBSCRIPTION_PREFIX });
  const records = await Promise.all(
    blobs.map((blob) => store.get(blob.key, { type: "json" }))
  );

  return records.filter(Boolean);
}
