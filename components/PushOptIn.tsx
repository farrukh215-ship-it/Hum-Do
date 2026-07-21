"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);
  return bytes;
}

export default function PushOptIn() {
  const [supported, setSupported] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    setSupported(true);
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    setVisible(Notification.permission === "default");
  }, []);

  async function enable() {
    const permission = await Notification.requestPermission();
    setVisible(false);
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // A unique-violation here just means this device is already subscribed.
    await supabase.from("push_subscriptions").insert({
      user_id: user.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    });
  }

  if (!supported || !visible) return null;

  return (
    <button
      type="button"
      onClick={enable}
      className="flex w-full items-center justify-center gap-2 rounded-3xl border border-black/5 bg-white px-4 py-3 text-sm font-semibold text-stone-600 shadow-sm"
    >
      <Bell className="h-4 w-4" strokeWidth={2} />
      Notifications on karein
    </button>
  );
}
