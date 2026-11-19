import type { AirtelRecharge } from "@/types/airtel";
import type { Subscription } from "@/types/subscriptions";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";
import { recordedPayments } from "@/lib/monthlySpending";

export type ReceiptCandidate = { id: string; from: string; subject: string; receivedOn: string; snippet: string };
export type ReviewedReceipt = { receipt: ReceiptCandidate; date: string; amount: number; kind: "plan" | "topup"; subscriptionId: string; targetPaymentId?: string };
function validate(review: ReviewedReceipt) {
  if (!/^[a-zA-Z0-9_-]{1,200}$/.test(review.receipt.id) || !isSubscriptionDate(review.date) || !Number.isFinite(review.amount) || review.amount <= 0 || Math.abs(review.amount * 100 - Math.round(review.amount * 100)) > 1e-6) throw new Error("Enter the confirmed payment date and a positive amount with up to two decimal places.");
}
export function receiptRecharge(review: ReviewedReceipt, existing: AirtelRecharge[], deletedIds: string[]): AirtelRecharge {
  validate(review);
  const id = `gmail:${review.receipt.id}`;
  const link = `https://mail.google.com/mail/u/0/#all/${review.receipt.id}`;
  if (existing.some(r => r.id === id || r.notes.includes(link))) throw new Error("This receipt is already linked to a payment.");
  if (review.targetPaymentId) {
    const payment = existing.find(r => r.id === review.targetPaymentId);
    if (!payment || deletedIds.includes(payment.id) || deletedIds.includes(id) || payment.status === "failed" || payment.paidByOther || payment.date !== review.date || payment.amount !== review.amount) throw new Error("The selected payment changed or cannot be linked. Review its date and amount again.");
    return { ...payment, notes: `${payment.notes}${payment.notes ? "\n" : ""}Receipt: ${link}` };
  }
  if (deletedIds.includes(id) || existing.some(r => (r.date === review.date && r.amount === review.amount && r.status !== "failed"))) throw new Error("This receipt or a matching payment is already recorded or was removed. Review your history first.");
  return { id, date: review.date, amount: review.amount, kind: review.kind, status: "success", paidByOther: false, source: "Gmail receipt · manually verified", notes: `Receipt: https://mail.google.com/mail/u/0/#all/${review.receipt.id}` };
}
export function receiptSubscription(review: ReviewedReceipt, subscriptions: Subscription[]): Subscription[] {
  validate(review);
  const service = subscriptions.find(s => s.id === review.subscriptionId);
  if (!service) throw new Error("Select an existing subscription first.");
  const link = `https://mail.google.com/mail/u/0/#all/${review.receipt.id}`;
  if (subscriptions.some(s => s.notes.includes(link) || s.billingHistory?.some(p=>p.source.includes(link)) || s.payments?.some(p => (p.journal === "gmail" && p.rowId === review.receipt.id) || p.notes.includes(link)))) throw new Error("This Gmail receipt is already recorded.");
  const previous = recordedPayments([service], { records: [], plan: null, deletedIds: [] });
  if (review.targetPaymentId) {
    const payment = previous.find(p => p.id === review.targetPaymentId);
    if (!payment || payment.date !== review.date || payment.amount !== review.amount) throw new Error("The selected payment changed. Review it again.");
    if (service.payments?.length) return subscriptions.map(s=>s.id!==service.id?s:{...s,payments:s.payments!.map(p=>`journal:${p.journal}:${p.rowId}:${p.amount}:${s.currency}`!==payment.id?p:{...p,notes:`${p.notes}${p.notes?"\n":""}Receipt: ${link}`})});
    if (service.billingHistory && service.billingHistory.filter(p=>p.date===payment.date).length>1) throw new Error("Multiple invoices share this date. Review the invoice history before linking.");
    if (service.billingHistory?.length) return subscriptions.map(s=>s.id!==service.id?s:{...s,billingHistory:s.billingHistory!.map(p=>`${s.id}:${p.date}`!==payment.id?p:{...p,source:`${p.source} · Receipt: ${link}`})});
    return subscriptions.map(s=>s.id!==service.id?s:{...s,notes:`${s.notes}${s.notes?"\n":""}Receipt for ${payment.date}: ${link}`});
  }
  if (previous.some(p => p.date === review.date && p.amount === review.amount)) throw new Error("A matching payment is already recorded for this subscription.");
  // Preserve previously counted invoice/last-paid entries when adding the first explicit payment.
  const payments = service.payments?.length ? service.payments : previous.map(p => ({ date: p.date, amount: p.amount, journal: "preserved-history", rowId: p.id, notes: "Existing recorded payment retained" }));
  return subscriptions.map(s => s.id !== service.id ? s : { ...s, payments: [...payments, { date: review.date, amount: review.amount, journal: "gmail", rowId: review.receipt.id, notes: `Receipt: https://mail.google.com/mail/u/0/#all/${review.receipt.id}` }] });
}
