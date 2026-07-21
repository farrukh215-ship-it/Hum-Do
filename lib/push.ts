import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID env vars are not configured");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

/** Sends a push notification to every device subscribed for this household, pruning dead subscriptions. */
export async function sendPushToHousehold(
  admin: SupabaseClient<Database>,
  householdId: string,
  payload: PushPayload,
) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  ensureVapidConfigured();

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("household_id", householdId);

  if (!subscriptions || subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}
