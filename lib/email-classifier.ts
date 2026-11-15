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
    text.includes("security") ||
    text.includes("sign-in") ||
    text.includes("signin") ||
    text.includes("account security") ||
    text.includes("suspicious sign-in") ||
    text.includes("verification code") ||
    text.includes("password reset") ||
    text.includes("two-factor") ||
    text.includes("2fa") ||
    text.includes("oauth") ||
    text.includes("data-sharing") ||
    text.includes("mpin") ||
    text.includes("unauthorized")
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
    text.includes("upi") ||
    text.includes("credited") ||
    text.includes("debited") ||
    text.includes("bank") ||
    text.includes("atm") ||
    text.includes("payout") ||
    text.includes("razorpay") ||
    text.includes("stripe") ||
    text.includes("statement") ||
    text.includes("funds balance") ||
    text.includes("invoice")
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
    text.includes("vercel") ||
    text.includes("aws") ||
    text.includes("github") ||
    text.includes("supabase") ||
    text.includes("cloudflare") ||
    text.includes("docker") ||
    text.includes("subprocessor") ||
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
    text.includes("internship") ||
    text.includes("job alert") ||
    text.includes("recruiter") ||
    text.includes("interview") ||
    text.includes("application") ||
    text.includes("university") ||
    text.includes("college") ||
    text.includes("evaluation") ||
    text.includes("faculty") ||
    text.includes("viva")
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
