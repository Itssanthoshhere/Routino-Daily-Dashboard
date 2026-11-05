import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteLinkedInProfile, getLinkedInProfile } from "@/lib/db";
import { hasLinkedInCredentials } from "@/lib/linkedin";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ authenticated: false }, { status: 401 });

  try {
    const profile = await getLinkedInProfile(email);
    return NextResponse.json({
      authenticated: true,
      configured: hasLinkedInCredentials(),
      profile,
    });
  } catch {
    return NextResponse.json({ error: "Could not load LinkedIn connection." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Sign in with Google first." }, { status: 401 });

  try {
    await deleteLinkedInProfile(email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not disconnect LinkedIn." }, { status: 500 });
  }
}
