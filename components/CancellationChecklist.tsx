import type { Subscription } from "@/types/subscriptions";

export function CancellationChecklist({ subscription, disabled, onChange }: { subscription: Subscription; disabled?: boolean; onChange: (next: Subscription) => void }) {
  if (subscription.renewalDecision !== "cancel") return null;
  const items = subscription.cancellationChecklist || [];
  const toggle = (id: string) => onChange({ ...subscription, cancellationChecklist: items.map(item => item.id === id ? { ...item, done: !item.done } : item) });
  return <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs"><p className="font-semibold text-amber-900">Cancellation checklist</p><p className="mt-1 text-amber-800">Planning notes only; cancel directly with the provider.</p>{items.length ? <div className="mt-2 space-y-1">{items.map(item => <label key={item.id} className="flex items-center gap-2"><input type="checkbox" checked={item.done} disabled={disabled} onChange={() => toggle(item.id)} /><span className={item.done ? "line-through text-muted" : ""}>{item.label}</span></label>)}</div> : <p className="mt-2 text-amber-800">Add steps while editing this plan.</p>}</div>;
}
