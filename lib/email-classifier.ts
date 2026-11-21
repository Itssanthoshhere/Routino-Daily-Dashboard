import type { DashboardMail } from "@/types/dashboard";

export type EmailActionType = "security" | "finance" | "infra" | "career" | "urgent" | "info";

export interface ClassifiedActionBadge {
  label: string;
  variant: EmailActionType;
  colorClass: string;
  iconName?: "shield" | "credit-card" | "server" | "briefcase" | "alert-circle";
}

export function classifyEmail(mail: Partial<DashboardMail>): ClassifiedActionBadge | null {
  const text = `${mail.from || ""} ${mail.subject || ""} ${mail.snippet || ""}`.toLowerCase();

  // 1. Security / Authentication / Permissions
  if (
    /\bsecurity\b/i.test(text) ||
    text.includes("sign-in") ||
    /\bsignin\b/i.test(text) ||
    text.includes("account security") ||
    text.includes("suspicious sign-in") ||
    text.includes("verification code") ||
    text.includes("password reset") ||
    text.includes("two-factor") ||
    /\b2fa\b/i.test(text) ||
    /\boauth\b/i.test(text) ||
    text.includes("data-sharing") ||
    /\bmpin\b/i.test(text) ||
    /\bunauthorized\b/i.test(text)
  ) {
    return {
      label: "SECURITY ALERT",
      variant: "security",
      colorClass: "bg-[#fce8e6] text-[#b91c1c] border border-[#fecaca]",
      iconName: "shield",
    };
  }

  // 2. Finance / Banking / UPI / Statements
  if (
    /\bupi\b/i.test(text) ||
    /\bcredited\b/i.test(text) ||
    /\bdebited\b/i.test(text) ||
    /\bbank\b/i.test(text) ||
    /\batm\b/i.test(text) ||
    /\bpayout\b/i.test(text) ||
    /\brazorpay\b/i.test(text) ||
    /\bstripe\b/i.test(text) ||
    /\bstatement\b/i.test(text) ||
    text.includes("funds balance") ||
    /\binvoice\b/i.test(text)
  ) {
    return {
      label: "FINANCE",
      variant: "finance",
      colorClass: "bg-[#fef3c7] text-[#92400e] border border-[#fde68a]",
      iconName: "credit-card",
    };
  }

  // 3. Cloud / Dev Infra / Vendor policies
  if (
    /\bvercel\b/i.test(text) ||
    /\baws\b/i.test(text) ||
    /\bgithub\b/i.test(text) ||
    /\bsupabase\b/i.test(text) ||
    /\bcloudflare\b/i.test(text) ||
    /\bdocker\b/i.test(text) ||
    /\bsubprocessor\b/i.test(text) ||
    text.includes("project paused") ||
    text.includes("service alert") ||
    text.includes("deletion deadline")
  ) {
    return {
      label: "INFRA ALERT",
      variant: "infra",
      colorClass: "bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]",
      iconName: "server",
    };
  }

  // 4. Career / Recruitment / Academics
  if (
    /\binternship\b/i.test(text) ||
    text.includes("job alert") ||
    /\brecruiter\b/i.test(text) ||
    /\binterview\b/i.test(text) ||
    /\b(?:job|internship|admission|college|university|scholarship|employment)\s+applications?\b|\bapplications?\s+(?:status|received|submitted|shortlisted|rejected|accepted)\b|\bthank you for applying\b/i.test(text) ||
    /\buniversity\b/i.test(text) ||
    /\bcollege\b/i.test(text) ||
    /\bevaluation\b/i.test(text) ||
    /\bfaculty\b/i.test(text) ||
    /\bviva\b/i.test(text)
  ) {
    return {
      label: "CAREER",
      variant: "career",
      colorClass: "bg-[#f3e8ff] text-[#7e22ce] border border-[#e9d5ff]",
      iconName: "briefcase",
    };
  }

  return null;
}
