import type { DashboardMail, Task } from "@/types/dashboard";

/**
 * Finds an existing task in Routino that tracks the given email message.
 * Matches by direct link, message ID in subtasks/links, or exact follow-up title.
 */
export function findTaskForEmail(mail: DashboardMail, tasks: Task[]): Task | undefined {
  if (!mail || !tasks || tasks.length === 0) return undefined;

  const directLink =
    mail.href ||
    (mail.source === "outlook"
      ? "https://outlook.live.com"
      : `https://mail.google.com/mail/u/0/#inbox/${mail.id}`);

  const mailIdClean = mail.id.replace(/^outlook-/, "");

  return tasks.find((t) => {
    // 1. Direct link matches
    if (t.link && (t.link === directLink || t.link.includes(mail.id) || t.link.includes(mailIdClean))) {
      return true;
    }

    // 2. Subtask link or subtask title mentions direct link or message id
    if (
      t.subtasks?.some(
        (st) =>
          (st.link &&
            (st.link === directLink ||
              st.link.includes(mail.id) ||
              st.link.includes(mailIdClean))) ||
          st.title.includes(mail.id) ||
          st.title.includes(mailIdClean) ||
          (directLink && st.title.includes(directLink))
      )
    ) {
      return true;
    }

    // 3. Subject-based exact title match
    if (
      mail.subject &&
      t.title.trim().toLowerCase() === `follow up: ${mail.subject}`.trim().toLowerCase()
    ) {
      return true;
    }

    return false;
  });
}
