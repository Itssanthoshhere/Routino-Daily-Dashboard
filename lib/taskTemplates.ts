import type { Task, SubTask } from "@/types/dashboard";
export type TaskTemplate = { id: string; name: string; title: string; category: NonNullable<Task["category"]>; priority: boolean; steps: string[] };
export const builtInTaskTemplates: TaskTemplate[] = [
  { id: "example-bill", name: "Bill payment", title: "Pay bill", category: "personal", priority: false, steps: ["Check amount and due date", "Pay bill", "Save payment receipt"] },
  { id: "example-travel", name: "Travel preparation", title: "Prepare for trip", category: "travel", priority: false, steps: ["Confirm tickets and accommodation", "Check documents", "Pack essentials"] },
  { id: "example-project", name: "Project setup", title: "Start project", category: "project", priority: false, steps: ["Define outcome", "Create repository", "Plan first milestone"] },
];
export function templateSubtasks(template: TaskTemplate): SubTask[] { return template.steps.map(title => ({ id: crypto.randomUUID(), title, completed: false })); }
export function validTaskTemplates(value: unknown): value is TaskTemplate[] {
  return Array.isArray(value) && value.length <= 100 && new Set(value.map(t=>t?.id)).size === value.length && value.every(t => t && typeof t.id === "string" && typeof t.name === "string" && !!t.name.trim() && typeof t.title === "string" && !!t.title.trim() && ["work","personal","meeting","urgent","project","travel"].includes(t.category) && typeof t.priority === "boolean" && Array.isArray(t.steps) && t.steps.length <= 100 && t.steps.every((step:unknown)=>typeof step === "string"));
}
