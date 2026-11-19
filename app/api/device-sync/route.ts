import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listDeviceSync, reportDeviceSync } from "@/lib/deviceSyncStore";
import { validDeviceReport } from "@/lib/deviceSync";
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET() { const email = (await auth())?.user?.email; if (!email)
    return json({ error: 'Sign in to view device activity.' }, 401); try {
    return json({ email: email.toLowerCase(), devices: await listDeviceSync(email) });
}
catch {
    return json({ error: 'Device activity is unavailable. Workspace sync is unaffected.' }, 503);
} }
export async function POST(request: NextRequest) { const email = (await auth())?.user?.email; if (!email)
    return json({ error: 'Sign in to report device activity.' }, 401); let body; try {
    body = await request.json();
}
catch {
    return json({ error: 'Invalid device report.' }, 400);
} if (typeof body?.expectedAccount !== 'string' || body.expectedAccount.toLowerCase() !== email.toLowerCase())
    return json({ error: 'Account changed.' }, 409); if (!validDeviceReport(body.device))
    return json({ error: 'Invalid device report.' }, 400); try {
    await reportDeviceSync(email, body.device);
    return json({ success: true });
}
catch {
    return json({ error: 'Device activity could not be reported. Workspace sync is unaffected.' }, 503);
} }
