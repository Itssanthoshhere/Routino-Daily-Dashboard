import type { DashboardMail, Task } from "@/types/dashboard";

const GENERIC_EMAIL_URLS = new Set([
  "https://outlook.live.com",
  "https://outlook.live.com/",
  "https://outlook.live.com/mail",
  "https://outlook.live.com/mail/",
  "https://outlook.office.com",
  "https://outlook.office.com/",
  "https://outlook.office.com/mail",
  "https://outlook.office.com/mail/",
  "https://mail.google.com",
  "https://mail.google.com/",
  "https://mail.google.com/mail",
  "https://mail.google.com/mail/",
  "https://mail.google.com/mail/u/0",
  "https://mail.google.com/mail/u/0/",
]);

function isGenericUrl(url?: string): boolean {
  if (!url) return true;
  const clean = url.trim().replace(/\/+$/, "");
  return GENERIC_EMAIL_URLS.has(clean) || GENERIC_EMAIL_URLS.has(url.trim());
}

/**
 * Finds an existing task in Routino that tracks the given email message.
 * Matches by non-generic direct link or stable message ID in task link or subtask metadata.
 * Does not match purely on subject title or generic portal URLs to prevent false-positive collisions across different messages.
 */
export function findTaskForEmail(mail: DashboardMail, tasks: Task[]): Task | undefined {
  if (!mail || !tasks || tasks.length === 0) return undefined;

  const mailIdClean = mail.id.replace(/^outlook-/, "");
  const directLink =
    mail.href ||
    (mail.source === "outlook"
      ? `https://outlook.live.com/mail/0/deeplink/read/${encodeURIComponent(mailIdClean)}`
      : `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(mail.id)}`);

  return tasks.find((t) => {
    // 1. Direct link matches (only if NOT a generic non-message root URL)
    if (t.link && !isGenericUrl(t.link) && !isGenericUrl(directLink) && t.link === directLink) {
      return true;
    }

    // 2. Task link explicitly contains the unique message ID
    if (
      t.link &&
      (t.link.includes(mail.id) || (mailIdClean && t.link.includes(mailIdClean)))
    ) {
      return true;
    }

    // 3. Subtask link or subtask title explicitly references direct link or unique message ID
    if (
      t.subtasks?.some(
        (st) =>
          (!isGenericUrl(st.link) && !isGenericUrl(directLink) && st.link === directLink) ||
          (st.link &&
            (st.link.includes(mail.id) ||
              (mailIdClean && st.link.includes(mailIdClean)))) ||
          st.title.includes(mail.id) ||
          (mailIdClean && st.title.includes(mailIdClean))
      )
    ) {
      return true;
    }

    return false;
  });
}
