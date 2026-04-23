import { createHash } from "node:crypto";
import webpush from "web-push";
import {
  deleteSubscriptionRecord,
  jsonResponse,
  listSubscriptionRecords,
  pruneReminders,
  saveSubscriptionRecord,
} from "../lib/push-store.mjs";

export const config = {
  schedule: "* * * * *",
};

function topicForReminder(reminder) {
  const seed = String(reminder?.tag || reminder?.id || "ruh-reminder");
  return `ruh-${createHash("sha256").update(seed).digest("hex").slice(0, 28)}`;
}

function configureWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error("Missing VAPID_SUBJECT, VAPID_PUBLIC_KEY, or VAPID_PRIVATE_KEY.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export default async function pushDispatch(req) {
  try {
    configureWebPush();
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { ok: false, error: "Web Push is not configured for this Netlify site." },
      { status: 500 }
    );
  }

  const records = await listSubscriptionRecords();
  const now = Date.now();
  const dueWindowEnd = now + 60 * 1000;
  const graceWindowStart = now - 5 * 60 * 1000;

  let scanned = 0;
  let sent = 0;
  let deleted = 0;
  let updated = 0;

  for (const record of records) {
    scanned += 1;

    if (!record?.enabled || !record?.endpoint || !record?.keys) {
      continue;
    }

    const dueReminders = (record.reminders || []).filter(
      (reminder) =>
        reminder &&
        !reminder.sentAt &&
        reminder.timeMs >= graceWindowStart &&
        reminder.timeMs <= dueWindowEnd
    );

    if (dueReminders.length === 0) {
      const pruned = pruneReminders(record.reminders || [], now);
      if (pruned.length !== (record.reminders || []).length) {
        record.reminders = pruned;
        record.updatedAt = new Date().toISOString();
        await saveSubscriptionRecord(record);
        updated += 1;
      }
      continue;
    }

    let recordDeleted = false;
    let recordChanged = false;

    for (const reminder of dueReminders) {
      const payload = {
        id: reminder.id,
        title: reminder.title,
        body: reminder.body,
        tag: reminder.tag || reminder.id,
        screen: reminder.screen || "home",
        url: reminder.url,
        timestamp: reminder.timeMs,
      };

      try {
        await webpush.sendNotification(
          { endpoint: record.endpoint, keys: record.keys },
          JSON.stringify(payload),
          {
            TTL: 60 * 60,
            urgency: "high",
            topic: topicForReminder(reminder),
          }
        );

        reminder.sentAt = new Date().toISOString();
        sent += 1;
        recordChanged = true;
      } catch (error) {
        const statusCode = error?.statusCode || error?.status || 0;

        if (statusCode === 404 || statusCode === 410) {
          await deleteSubscriptionRecord(record.endpoint);
          deleted += 1;
          recordDeleted = true;
          break;
        }

        console.error("Failed to send prayer reminder", {
          endpoint: record.endpoint,
          reminderId: reminder.id,
          statusCode,
          message: error?.message,
        });
      }
    }

    if (!recordDeleted && recordChanged) {
      record.reminders = pruneReminders(record.reminders || [], now);
      record.updatedAt = new Date().toISOString();
      record.lastDispatchAt = new Date().toISOString();
      await saveSubscriptionRecord(record);
      updated += 1;
    }
  }

  return jsonResponse({
    ok: true,
    scanned,
    sent,
    updated,
    deleted,
    timestamp: new Date().toISOString(),
    manual: req.method !== "POST",
  });
}
