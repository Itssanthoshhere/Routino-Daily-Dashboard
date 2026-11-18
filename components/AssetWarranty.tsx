"use client";
import { warrantyReminderDate } from "@/lib/assetRecords";
import type { AssetRecord } from "@/types/assets";
export function AssetWarranty({ record, disabled, onChange, onReminder }: { record: AssetRecord; disabled: boolean; onChange: (record: AssetRecord) => void; onReminder?: (date: string) => void }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const end = record.warrantyEnd;
  const days = end ? Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000) : null;
  const reminder = end ? warrantyReminderDate(end, today) : "";
  return <details className="mt-3 rounded-xl border border-line p-3 text-xs"><summary className="cursor-pointer font-semibold">Warranty {days === null ? "· Set expiry date" : days < 0 ? "· Expired" : `· ${days} days remaining`}</summary><label className="mt-3 block">Confirmed warranty expiry<input disabled={disabled} type="date" value={end || ""} onChange={event => onChange({ ...record, warrantyEnd: event.target.value, warrantyReminderDate: undefined })} className="ml-3 rounded-lg border border-line p-2" /></label><p className="mt-2 text-muted">Check your invoice or provider terms. Changing this date does not change an existing reminder task.</p>{end && days !== null && days >= 0 && onReminder && <button disabled={disabled || record.warrantyReminderDate === reminder} className="btn-theme mt-3 rounded-lg border border-line px-3 py-2" onClick={() => { onReminder(reminder); onChange({ ...record, warrantyReminderDate: reminder }); }}>{record.warrantyReminderDate === reminder ? "Reminder task added" : `Add reminder task · ${reminder}`}</button>}<p className="mt-2 text-muted">Reminders are due 30 days before expiry, or today if that date has passed. Your task notification settings apply.</p></details>;
}
