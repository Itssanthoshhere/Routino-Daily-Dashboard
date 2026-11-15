import type { DashboardMail, Task } from "@/types/dashboard";

/**
 * Finds an existing task in Routino that tracks the given email message.
 * Matches by direct link or stable message ID in task link or subtask metadata.
 * Does not match purely on subject title to prevent false-positive collisions across different messages.
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
    if (
      t.link &&
      (t.link === directLink ||
        t.link.includes(mail.id) ||
        (mailIdClean && t.link.includes(mailIdClean)))
    ) {
      return true;
    }

    // 2. Subtask link or subtask title mentions direct link or message id
    if (
      t.subtasks?.some(
        (st) =>
          (st.link &&
            (st.link === directLink ||
              st.link.includes(mail.id) ||
              (mailIdClean && st.link.includes(mailIdClean)))) ||
          st.title.includes(mail.id) ||
          (mailIdClean && st.title.includes(mailIdClean)) ||
          (directLink && st.title.includes(directLink))
      )
    ) {
      return true;
    }

    return false;
  });
}
