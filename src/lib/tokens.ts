import { nanoid } from "nanoid";

export function generateToken(): string {
  return nanoid(24);
}
