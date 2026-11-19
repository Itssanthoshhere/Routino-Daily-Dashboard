"use client";
import { useEffect, useRef, useState } from "react";
import type { Subscription } from "@/types/subscriptions";
import type { ReceiptCandidate, ReviewedReceipt } from "@/lib/receiptPayments";

const control = "mt-1 w-full rounded-xl border border-line bg-white p-2 text-sm";
const button = "btn-theme rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50";
export function GmailReceiptReview({ kind, subscriptions = [], disabled, onConfirm }: {
  kind: "recharge" | "subscription";
  subscriptions?: Subscription[];
  disabled: boolean;
  onConfirm: (review: ReviewedReceipt) => void;
}) {
  const [receipts, setReceipts] = useState<ReceiptCandidate[]>([]);
  const [account, setAccount] = useState("");
  const [nextPage, setNextPage] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<ReceiptCandidate | null>(null);
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [planKind, setPlanKind] = useState<"plan" | "topup">("plan");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const alive = useRef(true);
  const latest = useRef({ disabled, onConfirm });
  useEffect(() => { latest.current = { disabled, onConfirm }; }, [disabled, onConfirm]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const search = async (pageToken = "") => {
    setBusy(true); setMessage(""); setSelected(null);
    try {
      const response = await fetch(`/api/mail/receipts?kind=${kind}&pageToken=${encodeURIComponent(pageToken)}`, { cache: "no-store" });
      const result = await response.json();
      if (!alive.current) return;
      if (!response.ok) throw new Error(result.error || "Receipt search failed.");
      if (pageToken && account !== result.account) { setReceipts([]); setNextPage(""); throw new Error("Your Google account changed. Search again."); }
      setAccount(result.account); setReceipts(result.receipts); setNextPage(result.nextPageToken);
      setMessage(`${result.receipts.length} possible receipts found.${result.unavailable ? ` ${result.unavailable} messages could not be read; search again to retry.` : ""}`);
    } catch (error) {
      if (alive.current) setMessage(error instanceof Error ? error.message : "Receipt search failed.");
    } finally { if (alive.current) setBusy(false); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !confirmed || disabled || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await response.json();
      if (!alive.current) return;
      if (!response.ok || !account || session.user?.email?.toLowerCase() !== account) throw new Error("Your signed-in account changed. Search again before saving.");
      if (latest.current.disabled) throw new Error("Wait for tracker sync before saving.");
      latest.current.onConfirm({ receipt: selected, date, amount: Number(amount), kind: planKind, subscriptionId });
      setSelected(null); setReceipts(previous => previous.filter(r => r.id !== selected.id));
      setMessage("Payment submitted to your tracker. Check the account sync status for confirmation.");
    } catch (error) {
      if (alive.current) setMessage(error instanceof Error ? error.message : "Could not add payment.");
    } finally { if (alive.current) setBusy(false); }
  };
  const service = subscriptions.find(s => s.id === subscriptionId);
  return <details className="rounded-2xl border border-line bg-white p-4">
    <summary className="cursor-pointer text-sm font-semibold">Find {kind === "recharge" ? "Airtel receipts" : "subscription invoices"} in Gmail</summary>
    <p className="mt-3 text-xs text-muted">Search the last year of your connected Gmail. Review the original message before adding a payment. Search previews may include unpaid invoices or payments for another number.</p>
    <button type="button" className={button + " mt-3"} disabled={busy || disabled} onClick={() => void search()}>{busy ? "Working…" : "Search Gmail"}</button>
    {account && <p className="mt-2 text-xs text-muted">Gmail account: {account}</p>}
    <p role="status" className="mt-2 text-xs">{message}</p>
    <ul className="mt-3 max-h-96 divide-y divide-line overflow-auto">{receipts.map(receipt => <li key={receipt.id} className="space-y-2 py-3 text-xs">
      <p className="font-semibold">{receipt.subject || "No subject"}</p><p className="text-muted">{receipt.from} · {receipt.receivedOn}</p><p className="whitespace-pre-wrap">{receipt.snippet}</p>
      <div className="flex flex-wrap gap-3"><a className="font-semibold text-forest underline" href={`https://mail.google.com/mail/u/0/#all/${encodeURIComponent(receipt.id)}`} target="_blank" rel="noopener noreferrer">Open original in Gmail</a>
        <button type="button" className={button} disabled={busy || disabled} onClick={() => { setSelected(receipt); setDate(""); setAmount(""); setSubscriptionId(""); setPlanKind("plan"); setConfirmed(false); }}>Review payment</button></div>
    </li>)}</ul>
    {nextPage && <button type="button" className={button} disabled={busy || disabled} onClick={() => void search(nextPage)}>Next receipts</button>}
    {selected && <form className="mt-4 space-y-3 rounded-xl border border-line p-4" onSubmit={save}>
      <h4 className="text-sm font-semibold">Review: {selected.subject}</h4>
      <p className="text-xs text-muted">Enter details from the receipt. The email’s received date is not assumed to be the payment date.</p>
      {kind === "subscription" && <label className="block text-xs">Existing subscription<select required className={control} value={subscriptionId} onChange={e => { setSubscriptionId(e.target.value); setConfirmed(false); }}><option value="">Choose a subscription</option>{subscriptions.map(s => <option key={s.id} value={s.id}>{s.name} · {s.currency}</option>)}</select></label>}
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">Confirmed payment date<input required type="date" className={control} value={date} onChange={e => { setDate(e.target.value); setConfirmed(false); }}/></label>
        <label className="text-xs">Amount paid ({kind === "recharge" ? "INR" : service?.currency || "choose subscription"})<input required type="number" min="0.01" step="0.01" className={control} value={amount} onChange={e => { setAmount(e.target.value); setConfirmed(false); }}/></label></div>
      {kind === "recharge" && <label className="block text-xs">Recharge type<select className={control} value={planKind} onChange={e => setPlanKind(e.target.value as "plan" | "topup")}><option value="plan">Main plan</option><option value="topup">Data top-up</option></select></label>}
      <label className="flex items-start gap-2 text-xs"><input required type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>I checked the original receipt: this is my successful payment, for {kind === "recharge" ? "my own Airtel number" : "the selected subscription and currency"}, with the date and amount above. It is not a pending, failed, refunded or duplicate payment.</label>
      <div className="flex gap-2"><button className={button} disabled={busy || disabled || !confirmed || (kind === "subscription" && !service)}>Add confirmed payment</button><button type="button" className={button} disabled={busy} onClick={() => setSelected(null)}>Cancel</button></div>
    </form>}
  </details>;
}
