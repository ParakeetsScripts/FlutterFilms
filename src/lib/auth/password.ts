import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string) {
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
}
