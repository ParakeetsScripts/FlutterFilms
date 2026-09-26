import "server-only";

import { getDatabase } from "@/lib/db/client";

const ACTIVATION_EVENTS = [
  "watchlist_added",
  "shared_list_created",
  "tonight_picker_completed",
  "recommendation_saved",
  "room_joined",
  "user_activated",
];

export async function getRetentionMetrics() {
  const db = await getDatabase();
  const users = await db.get<{ total: number }>("SELECT COUNT(*) AS total FROM users");
  const totalUsers = Number(users?.total ?? 0);

  if (totalUsers < 5) {
    return {
      insufficientData: true,
      activationRate: "INSUFFICIENT DATA",
      retention: { day1: "INSUFFICIENT DATA", day7: "INSUFFICIENT DATA", day14: "INSUFFICIENT DATA", day30: "INSUFFICIENT DATA" },
      funnel: {
        signups: 0,
        activated: 0,
        returned: 0,
        social: 0,
      },
    };
  }

  const signups = await db.get<{ total: number }>(
    `SELECT COUNT(*) AS total FROM analytics_events WHERE event_name = 'signup_completed'`,
  );
  const activated = await db.get<{ total: number }>(
    `SELECT COUNT(DISTINCT user_id) AS total FROM analytics_events
     WHERE user_id IS NOT NULL AND event_name IN (${ACTIVATION_EVENTS.map(() => "?").join(",")})`,
    ACTIVATION_EVENTS,
  );
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const returned = await db.get<{ total: number }>(
    `SELECT COUNT(DISTINCT user_id) AS total FROM analytics_sessions
     WHERE user_id IS NOT NULL AND last_seen_at > ?`,
    [weekAgo],
  ).catch(() => ({ total: 0 }));

  const social = await db.get<{ total: number }>(
    `SELECT COUNT(DISTINCT user_id) AS total FROM analytics_events
     WHERE user_id IS NOT NULL AND event_name IN ('room_created', 'room_joined', 'shared_list_created')`,
  );

  const signupCount = Number(signups?.total ?? 0);
  const activatedCount = Number(activated?.total ?? 0);
  const activationRate =
    signupCount > 0 ? `${Math.round((activatedCount / signupCount) * 100)}%` : "INSUFFICIENT DATA";

  return {
    insufficientData: signupCount < 10,
    activationRate,
    retention: {
      day1: "INSUFFICIENT DATA",
      day7: "INSUFFICIENT DATA",
      day14: "INSUFFICIENT DATA",
      day30: "INSUFFICIENT DATA",
    },
    funnel: {
      signups: signupCount,
      activated: activatedCount,
      returned: Number(returned?.total ?? 0),
      social: Number(social?.total ?? 0),
    },
  };
}
