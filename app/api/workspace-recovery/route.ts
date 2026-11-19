import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readWorkspaceBackup } from "@/lib/workspaceBackups";
import { readRecoveryWorkspace, recoverWorkspaceRecord } from "@/lib/workspaceRecovery";
import { recoveryFields, selectedRecoveryRecord, type RecoverySelection } from "@/lib/selectiveRecovery";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET() { const email = (await auth())?.user?.email; if (!email)
    return json({ error: 'Sign in to preview recovery.' }, 401); try {
    const workspace = await readRecoveryWorkspace(email);
    return workspace ? json({ email: email.toLowerCase(), ...workspace }) : json({ error: 'No saved workspace found.' }, 404);
}
catch {
    return json({ error: 'Selective recovery requires an available Neon database.' }, 503);
} }
export async function POST(request: NextRequest) {
    const email = (await auth())?.user?.email;
    if (!email)
        return json({ error: 'Sign in to recover records.' }, 401);
    let body;
    try {
        body = await request.json();
    }
    catch {
        return json({ error: 'Invalid recovery request.' }, 400);
    }
    if (typeof body?.expectedAccount !== 'string' || body.expectedAccount.toLowerCase() !== email.toLowerCase())
        return json({ error: 'Account changed. Reopen the preview.' }, 409);
    const selection = body.selection as RecoverySelection;
    if (!selection || !recoveryFields.includes(selection.field) || typeof selection.id !== 'string' || selection.id.length > 2000 || typeof body.version !== 'string' || !body.version)
        return json({ error: 'Choose one supported record and preview it first.' }, 400);
    try {
        let record = body.record;
        if (body.backupId !== undefined) {
            if (typeof body.backupId !== 'string')
                return json({ error: 'Invalid backup.' }, 400);
            const backup = await readWorkspaceBackup(email, body.backupId);
            if (!backup)
                return json({ error: 'Backup not found.' }, 404);
            record = selectedRecoveryRecord(backup.data, selection);
        }
        if (record === undefined)
            return json({ error: 'Record not found in this source.' }, 404);
        const result = await recoverWorkspaceRecord(email, selection, record, body.version);
        return result.success ? json({ success: true }) : json({ error: 'Workspace changed since preview. Refresh and compare again.' }, 409);
    }
    catch (error) {
        return json({ error: error instanceof Error && error.message.startsWith('Invalid') ? error.message : 'Recovery could not complete. Refresh the preview before retrying.' }, 400);
    }
}
