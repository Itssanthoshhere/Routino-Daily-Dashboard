import Link from "next/link";
import { Command, LogOut, ArrowLeft, Shield, CalendarDays, Mail, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { disconnectGoogle } from "@/app/actions";
import { appConfig } from "@/lib/config";

export const metadata = {
  title: `Sign out — ${appConfig.name}`,
  description: "Disconnect your Google account and sign out of your workspace.",
};

export default async function SignOutPage() {
  const session = await auth();
  const isConnected = !!session?.user;

  return (
    <div className="min-h-screen bg-[#f7f7f2] flex flex-col items-center justify-center p-4 sm:p-6 text-ink">
      {/* Brand Header */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-2.5 group transition-transform hover:scale-105"
      >
        <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-forest text-accent shadow-sm">
          <Command size={20} />
        </span>
        <span className="text-[18px] font-bold tracking-tight">
          {appConfig.name.toLowerCase()}
          <span className="text-[#9eaaa1]">.</span>
        </span>
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-md rounded-3xl border border-line bg-[#fbfcf8] p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          {/* Icon Badge */}
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fdf0ec] text-[#c05746] shadow-sm mb-4">
            <LogOut size={24} />
          </div>

          <h1 className="text-[20px] font-bold tracking-tight text-ink">
            {isConnected ? "Sign out of your workspace?" : "No active session"}
          </h1>
          <p className="mt-1 text-[13px] text-muted max-w-xs">
            {isConnected
              ? `You are currently connected as ${session?.user?.email || session?.user?.name || "Google user"}.`
              : "You are already signed out. Your workspace is running in local preview mode."}
          </p>
        </div>

        {isConnected ? (
          <>
            {/* Impact Details */}
            <div className="mt-6 rounded-2xl border border-line bg-white p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#738078]">
                What happens when you disconnect:
              </p>
              <div className="space-y-2 text-[12px] text-[#425047]">
                <div className="flex items-start gap-2.5">
                  <CalendarDays size={15} className="mt-0.5 text-muted shrink-0" />
                  <span>Google Calendar events sync will pause.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail size={15} className="mt-0.5 text-muted shrink-0" />
                  <span>Unread Gmail inbox preview will disconnect.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="mt-0.5 text-[#5fa77d] shrink-0" />
                  <span>Your custom tasks and focus timer records will remain safely saved in this browser.</span>
                </div>
              </div>
            </div>

            {/* Actions Form */}
            <form action={disconnectGoogle} className="mt-6 space-y-2.5">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#c05746] px-5 py-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[#a84435] transition"
              >
                <LogOut size={15} /> Disconnect Google & Sign Out
              </button>

              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-[13px] font-semibold text-[#5c6960] hover:bg-[#f1f3ed] transition"
              >
                <ArrowLeft size={14} /> Stay in Workspace
              </Link>
            </form>
          </>
        ) : (
          <div className="mt-6 space-y-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-[13px] font-semibold text-white shadow-sm hover:bg-[#8b1116] transition"
            >
              <ArrowLeft size={14} /> Return to Dashboard
            </Link>
          </div>
        )}

        {/* Security assurance */}
        <div className="mt-6 border-t border-line pt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <Shield size={12} className="text-[#85af83]" />
          <span>OAuth tokens are securely destroyed upon sign-out</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-[10px] text-muted">
        <p>{appConfig.name} · Private by design · {appConfig.tagline}</p>
      </footer>
    </div>
  );
}
