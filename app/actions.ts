"use server";

import { signIn } from "@/lib/auth";

export async function connectGoogle() {
  await signIn("google");
}
