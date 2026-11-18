import { monthlyCost, type Subscription } from "@/types/subscriptions";
export { validSharedExpense } from "@/lib/subscriptionValidation";
import { isSubscriptionDate } from "@/lib/subscriptionValidation";
export const billingCurrencies = ["INR", "USD", "EUR", "GBP"] as const;
export type SubscriptionBudget = {
    id: Subscription["currency"];
    monthlyLimit: number;
};
export type SharedExpense = {
    id: string;
    date: string;
    currency: Subscription["currency"];
    total: number;
    paidBy: string;
    shares: {
        person: string;
        amount: number;
        settled: boolean;
    }[];
};
const cents = (value: number) => Math.round(value * 100);
export function validSubscriptionBudget(value: unknown): boolean {
    const v = value as SubscriptionBudget | null;
    return !!v && billingCurrencies.includes(v.id) && Number.isFinite(v.monthlyLimit) && v.monthlyLimit >= 0 && Math.abs(cents(v.monthlyLimit) / 100 - v.monthlyLimit) < 1e-8;
}
export function outstandingShares(expense: SharedExpense) { return expense.shares.filter(s => s.person.trim().toLowerCase() !== expense.paidBy.trim().toLowerCase() && !s.settled).reduce((sum, s) => sum + cents(s.amount), 0) / 100; }
export function budgetUsage(subscriptions: Subscription[], budgets: SubscriptionBudget[]) {
    return billingCurrencies.map(currency => ({ currency, monthly: subscriptions.filter(s => s.status === "active" && s.currency === currency).reduce((sum, s) => sum + monthlyCost(s), 0), limit: budgets.find(b => b.id === currency)?.monthlyLimit }));
}
export function renewalQueue(subscriptions: Subscription[], today: string) {
    const end = new Date(`${today}T12:00:00`);
    end.setDate(end.getDate() + 30);
    const horizon = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    return subscriptions.filter(s => s.status === "active" && s.cycle !== "bundled" && s.cycle !== "one-time").map(subscription => ({ subscription, date: [subscription.cancellationDeadline, subscription.trialEndDate, subscription.renewalDate].filter((d): d is string => !!d && isSubscriptionDate(d)).sort()[0] })).filter(row => row.date && row.date <= horizon).sort((a, b) => a.date.localeCompare(b.date));
}
export type ImportedPayment = {
    id: string;
    name: string;
    date: string;
    amount: number;
    currency: Subscription["currency"];
    reference: string;
};
/** Small RFC4180 reader: quoted commas, escaped quotes and embedded newlines. No remote calls. */
export function parsePaymentCsv(text: string): ImportedPayment[] {
    if (text.length > 500000)
        throw new Error("CSV is too large. Import at most 500 KB at a time.");
    const rows: string[][] = [];
    let row: string[] = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (quoted && text[i + 1] === '"') {
                cell += '"';
                i++;
            }
            else if (!cell || quoted)
                quoted = !quoted;
            else
                throw new Error("Invalid CSV quoting.");
        }
        else if (c === ',' && !quoted) {
            row.push(cell);
            cell = "";
        }
        else if ((c === '\n' || c === '\r') && !quoted) {
            if (c === '\r' && text[i + 1] === '\n')
                i++;
            row.push(cell);
            if (row.some(x => x.trim()))
                rows.push(row);
            row = [];
            cell = "";
        }
        else
            cell += c;
    }
    if (quoted)
        throw new Error("Unclosed CSV quote.");
    row.push(cell);
    if (row.some(x => x.trim()))
        rows.push(row);
    const headers = rows.shift()?.map(x => x.replace(/^\uFEFF/, "").trim().toLowerCase()) || [];
    if (!['name', 'date', 'amount', 'currency'].every(k => headers.includes(k)))
        throw new Error("Required CSV columns: name,date,amount,currency. Optional: reference.");
    if (rows.length > 500)
        throw new Error("Import at most 500 payments at a time.");
    return rows.map((values, index) => { const get = (key: string) => (values[headers.indexOf(key)] || "").trim(); const raw = get('amount'); const amount = Number(raw); const currency = get('currency').toUpperCase() as Subscription['currency']; if (!get('name') || !isSubscriptionDate(get('date')) || !/^\d+(\.\d{1,2})?$/.test(raw) || !Number.isFinite(amount) || amount <= 0 || !billingCurrencies.includes(currency))
        throw new Error(`Check CSV row ${index + 2}: use a name, YYYY-MM-DD date, positive amount (up to 2 decimals), and INR/USD/EUR/GBP.`); return { id: String(index), name: get('name'), date: get('date'), amount, currency, reference: get('reference') }; });
}
export function matchingPlan(payment: ImportedPayment, subscriptions: Subscription[]) {
    const normalize = (s: string) => s.toLowerCase().replace(new RegExp("[^\\p{L}\\p{N}]", "gu"), "");
    const matches = subscriptions.filter(s => s.currency === payment.currency && s.cycle !== "bundled" && normalize(s.name) === normalize(payment.name));
    return matches.length === 1 ? matches[0].id : "";
}
export function paymentAlreadyRecorded(payment: ImportedPayment, subscription: Subscription) {
    return !!subscription.payments?.some(p => (p.date === payment.date && cents(p.amount) === cents(payment.amount)) || (!!payment.reference && p.journal === "CSV import" && p.rowId === payment.reference)) || !!subscription.billingHistory?.some(p => p.date === payment.date && cents(p.amount) === cents(payment.amount)) || (!subscription.payments?.length && !subscription.billingHistory?.length && subscription.lastPaidDate === payment.date && cents(subscription.amount) === cents(payment.amount));
}
export function reconcilePayments(subscriptions: Subscription[], rows: {
    payment: ImportedPayment;
    subscriptionId: string;
}[]): Subscription[] {
    let next = subscriptions;
    for (const { payment, subscriptionId } of rows) {
        const plan = next.find(s => s.id === subscriptionId);
        if (!plan || plan.currency !== payment.currency || plan.cycle === "bundled")
            throw new Error("Match each selected payment to an existing plan in the same currency. Bundled access has no separate charge.");
        if (paymentAlreadyRecorded(payment, plan))
            continue;
        const previous = plan.payments?.length ? plan.payments : plan.billingHistory?.length ? plan.billingHistory.map(p => ({ date: p.date, amount: p.amount, journal: "Billing history", rowId: `invoice:${p.date}`, notes: p.source })) : plan.lastPaidDate ? [{ date: plan.lastPaidDate, amount: plan.amount, journal: "Previous recorded payment", rowId: `previous:${plan.lastPaidDate}`, notes: "Preserved existing payment" }] : [];
        const updated = { ...plan, payments: [...previous, { date: payment.date, amount: payment.amount, journal: "CSV import", rowId: payment.reference || `${payment.date}:${payment.amount}`, notes: payment.name }], lastPaidDate: [plan.lastPaidDate || "", payment.date].sort().at(-1), startDate: [plan.startDate || payment.date, payment.date].sort()[0] };
        next = next.map(s => s.id === plan.id ? updated : s);
    }
    return next;
}
