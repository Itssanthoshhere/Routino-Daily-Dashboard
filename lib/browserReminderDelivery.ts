/** Reserve an alert before showing it; a failed browser delivery must remain retryable. */
export function deliverBrowserReminder<T>(id: string, delivered: Set<string>, persist: (ids: string[]) => void, show: () => T): T {
  const previous = Array.from(delivered);
  delivered.add(id);
  try {
    persist(Array.from(delivered));
    return show();
  } catch (error) {
    delivered.delete(id);
    try { persist(previous); } catch { /* Storage restrictions must not obscure the delivery error. */ }
    throw error;
  }
}
