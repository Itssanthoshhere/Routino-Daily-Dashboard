import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteOutlookAccount, getOutlookAccount } from "@/lib/db";
import { hasOutlookCredentials } from "@/lib/outlook";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ authenticated: false }, { status: 401 });

  try {
    const account = await getOutlookAccount(email);
    return NextResponse.json({
      authenticated: true,
      configured: hasOutlookCredentials(),
      connected: Boolean(account?.accessToken),
      profile: account
        ? {
            email: account.email,
            name: account.name,
            connectedAt: account.connectedAt,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load Outlook connection status." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Sign in with Google first." }, { status: 401 });
  }

  try {
    await deleteOutlookAccount(email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not disconnect Outlook." }, { status: 500 });
  }
}
