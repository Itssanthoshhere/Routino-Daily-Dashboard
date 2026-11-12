"use server";

import { signIn, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function connectGoogle() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    // Instead of redirecting to the blank NextAuth internal signin page,
    // redirect with a setup query so the UI can explain how to set up keys.
    redirect("/dashboard?setup=google");
  }
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function disconnectGoogle() {
  await signOut({ redirectTo: "/" });
}
