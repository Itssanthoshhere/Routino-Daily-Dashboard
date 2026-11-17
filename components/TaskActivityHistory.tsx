import type { Task } from "@/types/dashboard";

export function TaskActivityHistory({ task }: { task: Task }) {
  const events = (task.activity || []).filter(entry => entry.action !== "Created").slice().reverse();
  return (
    <details className="px-3 pb-2 text-[11px] text-muted">
      <summary className="cursor-pointer">Activity history</summary>
      <ul className="mt-2 space-y-1">
        <li>Created · {new Date(task.createdAt).toLocaleString()}</li>
        {events.map((entry, index) => (
          <li key={`${entry.at}-${index}`}>{entry.action} · {new Date(entry.at).toLocaleString()}</li>
        ))}
      </ul>
      {!task.activity?.length && <p className="mt-1">Earlier changes were not recorded.</p>}
    </details>
  );
}
