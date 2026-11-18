import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";
// Older tabs must not bypass preview, exclusions, or version checks.
export async function POST() {
  if (!(await auth())?.user) return NextResponse.json({success:false,error:"Not authenticated"},{status:401});
  return NextResponse.json({success:false,error:"Open Calendar colors to preview and apply changes with your saved rules."},{status:409,headers:{"Cache-Control":"private, no-store"}});
}
