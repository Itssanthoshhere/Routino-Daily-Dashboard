"use client";
import { createContext, useContext, useState } from "react";
import { billingCurrencies, budgetUsage, validSubscriptionBudget, type SubscriptionBudget } from "@/lib/subscriptionPlanning";
import type { Subscription } from "@/types/subscriptions";
const Context = createContext<{
    budgets: SubscriptionBudget[];
    save: (budgets: SubscriptionBudget[]) => void;
}>({ budgets: [], save: () => { } });
export function SubscriptionBudgetProvider({ budgets, onChange, children }: {
    budgets: SubscriptionBudget[];
    onChange: (budgets: SubscriptionBudget[]) => void;
    children: React.ReactNode;
}) { return <Context.Provider value={{ budgets, save: onChange }}>{children}</Context.Provider>; }
export const formatBillingMoney = (amount: number, currency: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
export function SubscriptionBudgets({ subscriptions, disabled }: {
    subscriptions: Subscription[];
    disabled: boolean;
}) {
    const { budgets, save } = useContext(Context);
    const [currency, setCurrency] = useState<Subscription['currency']>('INR');
    const [limit, setLimit] = useState('');
    const [message, setMessage] = useState('');
    return <section className="rounded-2xl border border-line bg-white p-5">
    <h4 className="font-semibold">Monthly subscription budgets</h4>
    <p className="mt-1 text-xs text-muted">Projected recurring costs, separated by currency. Bundles, one-time and unconfirmed billing cycles add no separate recurring cost. Alerts stay in this workspace.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{budgetUsage(subscriptions, budgets).filter(row => row.monthly > 0 || row.limit !== undefined).map(row => <div key={row.currency} className={`rounded-xl border p-3 text-xs ${row.limit !== undefined && row.monthly > row.limit ? 'border-amber-300 bg-amber-50' : 'border-line'}`}>
        <strong>{formatBillingMoney(row.monthly, row.currency)} / month</strong>
        <p className="mt-1">{row.limit === undefined ? 'No limit set' : `Limit ${formatBillingMoney(row.limit, row.currency)} · ${row.monthly > row.limit ? `${formatBillingMoney(row.monthly - row.limit, row.currency)} over budget` : row.monthly >= row.limit * .9 ? 'Near budget limit' : 'Within budget'}`}</p>
        </div>)}</div>
    <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={e => { e.preventDefault(); const budget = { id: currency, monthlyLimit: Number(limit) }; if (!limit.trim() || !validSubscriptionBudget(budget)) {
        setMessage('Enter a non-negative limit with up to two decimal places.');
        return;
    } try {
        save([...budgets.filter(b => b.id !== currency), budget]);
        setMessage(`${currency} budget saved.`);
    }
    catch {
        setMessage('Could not save. Please retry.');
    } }}>
    <label className="text-xs">Currency<select disabled={disabled} className="ml-2 rounded-lg border border-line p-2" value={currency} onChange={e => { const c = e.target.value as Subscription['currency']; setCurrency(c); setLimit(String(budgets.find(b => b.id === c)?.monthlyLimit ?? '')); }}>{billingCurrencies.map(c => <option key={c}>{c}</option>)}</select>
    </label>
    <label className="text-xs">Monthly limit<input disabled={disabled} type="number" min="0" step="0.01" required className="ml-2 w-32 rounded-lg border border-line p-2" value={limit} onChange={e => setLimit(e.target.value)}/>
    </label>
    <button disabled={disabled} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs">Save limit</button>
    <button type="button" disabled={disabled || !budgets.some(b => b.id === currency)} className="btn-theme rounded-lg border border-line px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50" onClick={() => { try {
        save(budgets.filter(b => b.id !== currency));
        setMessage(`${currency} limit removed.`);
    }
    catch {
        setMessage('Could not save. Please retry.');
    } }}>Remove limit</button>
    </form>
    <p role="status" className="mt-2 text-xs text-muted">{message}</p>
    </section>;
}
