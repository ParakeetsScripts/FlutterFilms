const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when the id can be used as a Postgres `users.id` / `user_id` foreign key. */
export function isDatabaseUserId(userId: string | null | undefined): boolean {
  return Boolean(userId && UUID_RE.test(userId));
}
